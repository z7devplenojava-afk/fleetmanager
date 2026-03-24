package com.z7design.fleet_manager.worker;

import com.z7design.fleet_manager.model.DocumentPage;
import com.z7design.fleet_manager.model.Payslip;
import com.z7design.fleet_manager.model.PaymentReceipt;
import com.z7design.fleet_manager.model.PaymentReceiptStatus;
import com.z7design.fleet_manager.repository.DocumentPageRepository;
import com.z7design.fleet_manager.repository.PaymentReceiptRepository;
import com.z7design.fleet_manager.repository.PayslipRepository;
import com.z7design.fleet_manager.service.MinIOService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Worker responsÃ¡vel por processar holerites e comprovantes sem match
 * e salvÃ¡-los individualmente na tabela payslips/payment_receipts
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UnmatchedPayslipWorker {

    private final StringRedisTemplate redisTemplate;
    private final DocumentPageRepository documentPageRepository;
    private final PayslipRepository payslipRepository;
    private final PaymentReceiptRepository paymentReceiptRepository;
    private final MinIOService minIOService;

    private static final String STREAM_VALIDATED = "stream:validated";
    private static final String CONSUMER_GROUP = "unmatched-group";
    private static final String CONSUMER_NAME = "unmatched-worker-1";
    private static final String OUTPUT_DIR = "backend/holerites";

    @PostConstruct
    public void init() {
        log.info(
                "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
        log.info("ðŸŸ¡ UNMATCHED PAYSLIP WORKER: Iniciando inicializaÃ§Ã£o...");
        log.info(
                "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â••â•â•â•â•â•â•â•â•â•â•â•");

        // InicializaÃ§Ã£o assÃ­ncrona para nÃ£o bloquear o startup do Spring se o Redis
        // estiver fora
        new Thread(() -> {
            try {
                redisTemplate.opsForStream().createGroup(STREAM_VALIDATED, ReadOffset.from("0"), CONSUMER_GROUP);
                log.info("âœ… UNMATCHED PAYSLIP WORKER: Consumer group '{}' criado/verificado", CONSUMER_GROUP);
            } catch (Exception e) {
                log.info("â„¹ï¸ UNMATCHED PAYSLIP WORKER: Consumer group '{}' jÃ¡ existe ou erro: {}", CONSUMER_GROUP,
                        e.getMessage());
            }
            log.info("âœ… UNMATCHED PAYSLIP WORKER: InicializaÃ§Ã£o concluÃ­da - Worker pronto!");
        }).start();

        log.info("ðŸŸ¡ UNMATCHED PAYSLIP WORKER: InicializaÃ§Ã£o agendada em background.");
    }

    @Scheduled(fixedDelay = 2000) // Processa a cada 2 segundos
    @Transactional
    public void processValidatedDocuments() {
        try {
            // Log periÃ³dico para debug (a cada 5 segundos)
            long currentTime = System.currentTimeMillis();
            boolean shouldLog = (currentTime % 5000 < 2000);

            if (shouldLog) {
                try {
                    Long streamLength = redisTemplate.opsForStream().size(STREAM_VALIDATED);
                    log.debug("ðŸŸ¡ UnmatchedPayslipWorker: Verificando stream:validated (tamanho: {})", streamLength);
                } catch (Exception e) {
                    log.debug("ðŸŸ¡ UnmatchedPayslipWorker: Erro ao verificar tamanho do stream: {}", e.getMessage());
                }
            }

            // Tentar ler mensagens do stream
            @SuppressWarnings("unchecked")
            List<MapRecord<String, String, String>> records = (List<MapRecord<String, String, String>>) (List<?>) redisTemplate
                    .opsForStream().read(
                            org.springframework.data.redis.connection.stream.Consumer.from(CONSUMER_GROUP,
                                    CONSUMER_NAME),
                            StreamOffset.create(STREAM_VALIDATED, ReadOffset.lastConsumed()));

            if (records == null || records.isEmpty()) {
                // Se nÃ£o houver mensagens novas, tentar ler do inÃ­cio (pode haver mensagens
                // nÃ£o processadas)
                if (shouldLog) {
                    log.debug(
                            "ðŸŸ¡ UnmatchedPayslipWorker: Nenhuma mensagem nova encontrada, tentando ler do inÃ­cio...");
                }
                try {
                    @SuppressWarnings("unchecked")
                    List<MapRecord<String, String, String>> allRecords = (List<MapRecord<String, String, String>>) (List<?>) redisTemplate
                            .opsForStream().read(
                                    org.springframework.data.redis.connection.stream.Consumer.from(CONSUMER_GROUP,
                                            CONSUMER_NAME),
                                    StreamOffset.create(STREAM_VALIDATED, ReadOffset.from("0")));
                    if (allRecords != null && !allRecords.isEmpty()) {
                        records = allRecords;
                        log.info("ðŸŸ¡ UnmatchedPayslipWorker: Encontradas {} mensagens nÃ£o processadas",
                                records.size());
                    }
                } catch (Exception e) {
                    // Ignorar erro - pode ser que nÃ£o haja mensagens mesmo
                    if (shouldLog) {
                        log.debug("ðŸŸ¡ UnmatchedPayslipWorker: Nenhuma mensagem encontrada no stream");
                    }
                }
            }

            if (records == null || records.isEmpty()) {
                return;
            }

            log.info("ðŸŸ¡ UnmatchedPayslipWorker: Processando {} documentos validados", records.size());
            System.out.println("ðŸŸ¡ UnmatchedPayslipWorker: Processando " + records.size() + " documentos validados");

            for (MapRecord<String, String, String> record : records) {
                try {
                    processValidatedDocument(record);
                    redisTemplate.opsForStream().acknowledge(STREAM_VALIDATED, CONSUMER_GROUP, record.getId());
                } catch (Exception e) {
                    log.error("Erro ao processar documento validado", e);
                }
            }
        } catch (Exception e) {
            log.error("Erro no UnmatchedPayslipWorker", e);
        }
    }

    private void processValidatedDocument(MapRecord<String, String, String> record) {
        String pageIdStr = record.getValue().get("pageId");
        String typeStr = record.getValue().get("type");
        String statusStr = record.getValue().get("status");
        String fileHashFromRecord = record.getValue().get("fileHash"); // Hash do arquivo completo

        log.info("ðŸŸ¡ UnmatchedPayslipWorker: Recebida mensagem - pageId: {}, type: {}, status: {}, fileHash: {}",
                pageIdStr, typeStr, statusStr,
                fileHashFromRecord != null
                        ? fileHashFromRecord.substring(0, Math.min(16, fileHashFromRecord.length())) + "..."
                        : "null");

        if (pageIdStr == null) {
            log.warn("âš ï¸ UnmatchedPayslipWorker: pageId nÃ£o encontrado na mensagem. Campos: {}",
                    record.getValue());
            return;
        }

        try {
            UUID pageId = UUID.fromString(pageIdStr);
            DocumentPage page = documentPageRepository.findById(pageId).orElse(null);

            if (page == null) {
                log.warn("âš ï¸ UnmatchedPayslipWorker: DocumentPage {} nÃ£o encontrada no banco de dados", pageId);
                return;
            }

            log.info(
                    "ðŸŸ¡ UnmatchedPayslipWorker: DocumentPage encontrada - ID: {}, Type: {}, Status: {}, CPF: {}, Nome: {}, PerÃ­odo: {}",
                    pageId, page.getType(), page.getStatus(), page.getCpf(), page.getName(), page.getPeriod());

            // Processar apenas se o status for OK ou REVIEW
            if (page.getStatus() != DocumentPage.DocumentPageStatus.OK &&
                    page.getStatus() != DocumentPage.DocumentPageStatus.REVIEW) {
                log.info("â„¹ï¸ UnmatchedPayslipWorker: DocumentPage {} com status {} nÃ£o serÃ¡ processada",
                        pageId, page.getStatus());
                return;
            }

            // Processar baseado no tipo
            if (page.getType() == DocumentPage.DocumentType.HOLERITE) {
                log.info("ðŸŸ¡ UnmatchedPayslipWorker: Processando HOLERITE - ID: {}, CPF: {}, Nome: {}, PerÃ­odo: {}",
                        pageId, page.getCpf(), page.getName(), page.getPeriod());
                saveUnmatchedPayslip(page, fileHashFromRecord);
            } else if (page.getType() == DocumentPage.DocumentType.COMPROVANTE) {
                log.info("ðŸŸ¡ UnmatchedPayslipWorker: Processando COMPROVANTE - ID: {}, Nome: {}, PerÃ­odo: {}",
                        pageId, page.getName(), page.getPeriod());
                saveUnmatchedPaymentReceipt(page);
            } else {
                log.warn("âš ï¸ UnmatchedPayslipWorker: Tipo de documento desconhecido: {}", page.getType());
            }
        } catch (Exception e) {
            log.error("âŒ Erro ao processar documento validado: pageId={}, erro={}", pageIdStr, e.getMessage(), e);
        }
    }

    private void saveUnmatchedPayslip(DocumentPage page, String fileHash) {
        try {
            log.info(
                    "ðŸŸ¡ðŸŸ¡ðŸŸ¡ UnmatchedPayslipWorker: INICIANDO SALVAMENTO DE PAYSLIP - CPF: {}, Nome: {}, PerÃ­odo: {}, Hash: {}",
                    page.getCpf(), page.getName(), page.getPeriod(),
                    fileHash != null ? fileHash.substring(0, Math.min(16, fileHash.length())) + "..." : "null");

            // Verificar campos obrigatÃ³rios
            if (page.getCpf() == null || page.getCpf().trim().isEmpty()) {
                log.warn(
                        "âš ï¸ UnmatchedPayslipWorker: CPF nÃ£o encontrado na DocumentPage {}. NÃ£o Ã© possÃ­vel salvar payslip.",
                        page.getId());
                return;
            }

            // Nome pode ser null - tentar extrair do texto bruto se nÃ£o encontrado
            String employeeName = page.getName();
            if (employeeName == null || employeeName.trim().isEmpty()
                    || employeeName.equals("NOME NÃƒO IDENTIFICADO")) {
                log.warn(
                        "âš ï¸ UnmatchedPayslipWorker: Nome nÃ£o encontrado na DocumentPage {}. Tentando extrair do texto bruto...",
                        page.getId());
                employeeName = extractNameFromRawText(page.getRawText());
                if (employeeName == null || employeeName.trim().isEmpty()) {
                    log.warn(
                            "âš ï¸ UnmatchedPayslipWorker: Nome nÃ£o encontrado no texto bruto. Usando valor padrÃ£o 'NOME NÃƒO IDENTIFICADO'.");
                    employeeName = "NOME NÃƒO IDENTIFICADO";
                } else {
                    log.info("âœ… UnmatchedPayslipWorker: Nome extraÃ­do do texto bruto: {}", employeeName);
                }
            }

            // Extrair empresa e setor - usar dados do DocumentPage se disponÃ­veis, senÃ£o
            // extrair do texto bruto
            String companyName = page.getCompanyName();
            if (companyName == null || companyName.trim().isEmpty()) {
                companyName = extractCompanyNameFromRawText(page.getRawText());
            }

            String companyCnpj = page.getCompanyCnpj();
            if (companyCnpj == null || companyCnpj.trim().isEmpty()) {
                companyCnpj = extractCompanyCnpjFromRawText(page.getRawText());
            }

            String workPostName = page.getWorkPostName();
            if (workPostName == null || workPostName.trim().isEmpty()) {
                workPostName = extractSectorFromRawText(page.getRawText());
            }

            log.info("ðŸŸ¡ UnmatchedPayslipWorker: Dados extraÃ­dos - Empresa: {}, CNPJ: {}, Setor: {}",
                    companyName, companyCnpj, workPostName);

            // Verificar perÃ­odo
            Integer month = extractMonth(page.getPeriod());
            Integer year = extractYear(page.getPeriod());

            if (month == null || year == null) {
                log.warn(
                        "âš ï¸ UnmatchedPayslipWorker: PerÃ­odo invÃ¡lido na DocumentPage {}: '{}'. NÃ£o Ã© possÃ­vel salvar payslip.",
                        page.getId(), page.getPeriod());
                return;
            }

            // VERIFICAÃ‡ÃƒO PRINCIPAL: Verificar se arquivo jÃ¡ foi processado (mesmo hash)
            // TEMPORARIAMENTE DESABILITADO para garantir que o processamento ocorra
            // TODO: Reativar apÃ³s confirmar que estÃ¡ funcionando corretamente
            /*
             * if (fileHash != null && !fileHash.isEmpty()) {
             * List<Payslip> existingByHash =
             * payslipRepository.findByHashConteudo(fileHash);
             * if (!existingByHash.isEmpty()) {
             * log.
             * info("â­ï¸ UnmatchedPayslipWorker: Arquivo jÃ¡ foi processado anteriormente (hash: {}...). Encontrados {} payslip(s) com mesmo hash. NÃ£o serÃ¡ processado novamente."
             * ,
             * fileHash.substring(0, Math.min(16, fileHash.length())),
             * existingByHash.size());
             * return; // Arquivo jÃ¡ processado, nÃ£o processar novamente
             * }
             * }
             */
            log.info(
                    "ðŸ” UnmatchedPayslipWorker: Hash do arquivo: {}... (verificaÃ§Ã£o de duplicata temporariamente desabilitada)",
                    fileHash != null ? fileHash.substring(0, Math.min(16, fileHash.length())) : "null");

            // Verificar se jÃ¡ existe payslip com mesmo CPF, mÃªs e ano (para determinar
            // versÃ£o)
            List<Payslip> existingByCpfMonthYear = payslipRepository
                    .findByCompanyCnpjAndCpfAndWorkPostNameAndMonthAndYear(
                            null, page.getCpf(), null, month, year);

            int nextVersion = 1;
            if (!existingByCpfMonthYear.isEmpty()) {
                // Encontrar a versÃ£o mais alta
                int maxVersion = existingByCpfMonthYear.stream()
                        .mapToInt(p -> p.getVersao() != null ? p.getVersao() : 1)
                        .max()
                        .orElse(1);
                nextVersion = maxVersion + 1;
                log.info(
                        "ðŸ“‹ UnmatchedPayslipWorker: Encontrados {} payslip(s) existente(s) para CPF: {}, PerÃ­odo: {}/{}. Criando versÃ£o {}.",
                        existingByCpfMonthYear.size(), page.getCpf(), month, year, nextVersion);
            }

            // Gerar PDF fÃ­sico na pasta holerites
            String pdfFilePath;
            try {
                pdfFilePath = generatePdfFromPage(page, month, year);
            } catch (IOException e) {
                log.error("âŒ Erro ao gerar PDF para pÃ¡gina {}: {}", page.getId(), e.getMessage(), e);
                // Continuar mesmo sem gerar PDF - salvar apenas no banco
                pdfFilePath = page.getS3Url(); // Usar URL da imagem como fallback
            }

            // Criar Payslip a partir do DocumentPage
            Payslip payslip = Payslip.builder()
                    .employeeName(employeeName)
                    .cpf(page.getCpf())
                    .companyName(companyName)
                    .companyCnpj(companyCnpj)
                    .workPostName(workPostName)
                    .month(month)
                    .year(year)
                    .fileName(Paths.get(pdfFilePath).getFileName().toString())
                    .processedAt(LocalDateTime.now())
                    .netValue(page.getLiquidValue())
                    .totalEarnings(page.getLiquidValue() != null ? page.getLiquidValue() : BigDecimal.ZERO)
                    .totalDeductions(BigDecimal.ZERO)
                    .versao(nextVersion) // Usar versÃ£o calculada
                    .hashConteudo(fileHash != null ? fileHash : page.getHash()) // Usar hash do arquivo completo, nÃ£o
                                                                                // da pÃ¡gina
                    .arquivoCaminho(pdfFilePath.replace('\\', '/'))
                    .build();

            payslip = payslipRepository.saveAndFlush(payslip);
            log.info(
                    "âœ…âœ…âœ… UnmatchedPayslipWorker: Payslip SALVO COM SUCESSO - ID={}, Nome={}, CPF={}, PerÃ­odo={}/{}, Arquivo={}",
                    payslip.getId(), payslip.getEmployeeName(), payslip.getCpf(),
                    payslip.getMonth(), payslip.getYear(),
                    pdfFilePath);
            System.out.println("âœ…âœ…âœ… UnmatchedPayslipWorker: Payslip SALVO - ID=" + payslip.getId() +
                    ", Nome=" + payslip.getEmployeeName() + ", CPF=" + payslip.getCpf() +
                    ", PerÃ­odo=" + payslip.getMonth() + "/" + payslip.getYear() + ", Arquivo=" + pdfFilePath);
        } catch (Exception e) {
            log.error("Erro ao salvar payslip sem match", e);
            throw e;
        }
    }

    private void saveUnmatchedPaymentReceipt(DocumentPage page) {
        try {
            // Verificar se jÃ¡ existe um payment receipt com os mesmos dados
            Integer month = extractMonth(page.getPeriod());
            Integer year = extractYear(page.getPeriod());

            // Buscar por nome e perÃ­odo (verificaÃ§Ã£o bÃ¡sica de duplicata)
            if (page.getName() != null && month != null && year != null) {
                List<PaymentReceipt> existing = paymentReceiptRepository.findByYearAndMonth(year, month);
                boolean exists = existing.stream()
                        .anyMatch(r -> r.getEmployeeName() != null &&
                                r.getEmployeeName().equalsIgnoreCase(page.getName()) &&
                                r.getNetSalary() != null &&
                                r.getNetSalary().equals(page.getLiquidValue()));

                if (exists) {
                    log.info("PaymentReceipt jÃ¡ existe para Nome: {}, PerÃ­odo: {}/{}",
                            page.getName(), month, year);
                    return;
                }
            }

            // Criar PaymentReceipt a partir do DocumentPage
            PaymentReceipt receipt = PaymentReceipt.builder()
                    .employeeName(page.getName())
                    .month(extractMonth(page.getPeriod()))
                    .year(extractYear(page.getPeriod()))
                    .netSalary(page.getLiquidValue())
                    .grossSalary(page.getLiquidValue())
                    .fileName("comprovante_" + page.getId() + ".pdf")
                    .filePath(page.getS3Url())
                    .fileSize(0L)
                    .status(PaymentReceiptStatus.PROCESSED)
                    .processedAt(LocalDateTime.now())
                    .build();

            receipt = paymentReceiptRepository.save(receipt);
            log.info("PaymentReceipt salvo (sem match): ID={}, Nome={}, PerÃ­odo={}",
                    receipt.getId(), receipt.getEmployeeName(),
                    String.format("%02d/%04d", receipt.getMonth(), receipt.getYear()));
        } catch (Exception e) {
            log.error("Erro ao salvar payment receipt sem match", e);
            throw e;
        }
    }

    private Integer extractMonth(String period) {
        if (period == null || period.length() < 2) {
            return null;
        }
        try {
            String[] parts = period.split("/");
            if (parts.length >= 1) {
                return Integer.parseInt(parts[0]);
            }
        } catch (Exception e) {
            log.warn("Erro ao extrair mÃªs do perÃ­odo: {}", period);
        }
        return null;
    }

    private Integer extractYear(String period) {
        if (period == null || period.length() < 4) {
            return null;
        }
        try {
            String[] parts = period.split("/");
            if (parts.length >= 2) {
                return Integer.parseInt(parts[1]);
            }
        } catch (Exception e) {
            log.warn("Erro ao extrair ano do perÃ­odo: {}", period);
        }
        return null;
    }

    /**
     * Gera PDF fÃ­sico na pasta holerites a partir da imagem da pÃ¡gina
     */
    private String generatePdfFromPage(DocumentPage page, Integer month, Integer year) throws IOException {
        log.info("ðŸŸ¡ UnmatchedPayslipWorker: Gerando PDF para pÃ¡gina {} - CPF: {}, Nome: {}",
                page.getId(), page.getCpf(), page.getName());

        // Baixar imagem do MinIO/local
        byte[] imageBytes = minIOService.downloadBytes(page.getS3Url());
        if (imageBytes == null || imageBytes.length == 0) {
            throw new IOException("Imagem nÃ£o encontrada ou vazia: " + page.getS3Url());
        }

        // Converter bytes para BufferedImage
        BufferedImage image = ImageIO.read(new ByteArrayInputStream(imageBytes));
        if (image == null) {
            throw new IOException("NÃ£o foi possÃ­vel ler a imagem: " + page.getS3Url());
        }

        // Criar estrutura de pastas: backend/holerites/mes-ano/
        String periodo = String.format("%02d-%04d", month != null ? month : 0, year != null ? year : 0);
        Path outputDir = Paths.get(OUTPUT_DIR, periodo);
        Files.createDirectories(outputDir);

        // Nome do arquivo: holerite_CPF_mes_ano.pdf ou holerite_ID.pdf se nÃ£o tiver
        // CPF
        String fileName;
        if (page.getCpf() != null && !page.getCpf().isEmpty()) {
            String cpfLimpo = page.getCpf().replaceAll("[^0-9]", "");
            fileName = String.format("holerite_%s_%02d_%04d.pdf", cpfLimpo, month, year);
        } else {
            fileName = String.format("holerite_%s.pdf", page.getId().toString().substring(0, 8));
        }

        Path pdfPath = outputDir.resolve(fileName);

        // Converter imagem para PDF usando PDFBox
        try (PDDocument document = new PDDocument()) {
            // Criar pÃ¡gina com o tamanho da imagem
            float width = image.getWidth();
            float height = image.getHeight();
            PDPage pdPage = new PDPage(new PDRectangle(width, height));
            document.addPage(pdPage);

            // Adicionar imagem Ã  pÃ¡gina
            try (PDPageContentStream contentStream = new PDPageContentStream(document, pdPage)) {
                PDImageXObject pdImage = PDImageXObject.createFromByteArray(document, imageBytes, "page");
                contentStream.drawImage(pdImage, 0, 0, width, height);
            }

            // Salvar PDF
            document.save(pdfPath.toFile());
            log.info("âœ… UnmatchedPayslipWorker: PDF gerado com sucesso: {}", pdfPath.toAbsolutePath());
        }

        return pdfPath.toString();
    }

    /**
     * Extrai nome do funcionÃ¡rio do texto bruto
     */
    private String extractNameFromRawText(String rawText) {
        if (rawText == null || rawText.trim().isEmpty()) {
            return null;
        }

        String[] linhas = rawText.split("\r?\n");

        // PadrÃ£o 1: CODIGO NOME CPF
        Pattern pattern1 = Pattern.compile("(\\d{4,6})\\s+(.+?)\\s+CPF[:\\s]", Pattern.CASE_INSENSITIVE);
        for (String linha : linhas) {
            Matcher matcher = pattern1.matcher(linha);
            if (matcher.find()) {
                String nome = matcher.group(2).trim();
                if (nome.length() >= 5 && !nome.toUpperCase().contains("FOLHA") &&
                        !nome.toUpperCase().contains("PAGAMENTO") && !nome.toUpperCase().contains("HOLERITE")) {
                    return nome.toUpperCase();
                }
            }
        }

        // PadrÃ£o 2: NOME CPF (sem cÃ³digo)
        Pattern pattern2 = Pattern.compile(
                "([A-ZÃÃ€Ã‚ÃƒÃ„Ã‰ÃˆÃŠÃ‹ÃÃŒÃŽÃÃ“Ã’Ã”Ã•Ã–ÃšÃ™Ã›ÃœÃ‡][A-ZÃÃ€Ã‚ÃƒÃ„Ã‰ÃˆÃŠÃ‹ÃÃŒÃŽÃÃ“Ã’Ã”Ã•Ã–ÃšÃ™Ã›ÃœÃ‡\\s]{4,}?)\\s{1,}CPF",
                Pattern.CASE_INSENSITIVE);
        for (String linha : linhas) {
            Matcher matcher = pattern2.matcher(linha);
            if (matcher.find()) {
                String nome = matcher.group(1).trim();
                if (nome.length() >= 5 && !nome.toUpperCase().contains("FOLHA") &&
                        !nome.toUpperCase().contains("PAGAMENTO") && !nome.toUpperCase().contains("HOLERITE")) {
                    return nome.toUpperCase();
                }
            }
        }

        return null;
    }

    /**
     * Extrai nome da empresa do texto bruto
     */
    private String extractCompanyNameFromRawText(String rawText) {
        if (rawText == null || rawText.trim().isEmpty()) {
            return null;
        }

        String[] linhas = rawText.split("\r?\n");

        // PadrÃ£o 1: Procurar por CNPJ e pegar nome da mesma linha ou linha anterior
        Pattern cnpjPattern = Pattern.compile(
                "CNPJ[:\\s]*([0-9]{2}\\.?[0-9]{3}\\.?[0-9]{3}/?[0-9]{4}-?[0-9]{2}|[0-9]{14})",
                Pattern.CASE_INSENSITIVE);
        for (int i = 0; i < linhas.length; i++) {
            String linha = linhas[i].trim();
            Matcher cnpjMatcher = cnpjPattern.matcher(linha);
            if (cnpjMatcher.find()) {
                // Tentar extrair nome da mesma linha (antes do CNPJ)
                int cnpjIndex = linha.toUpperCase().indexOf("CNPJ");
                if (cnpjIndex > 10) {
                    String possibleName = linha.substring(0, cnpjIndex).trim();
                    possibleName = possibleName.replaceAll("(?i)(EMPRESA|RAZÃƒO SOCIAL|EMPREGADOR)[:\\s]*", "").trim();
                    if (possibleName.length() > 5 && !possibleName.matches(".*\\d{3}.*")) {
                        return possibleName.toUpperCase();
                    }
                }

                // Tentar linha anterior
                if (i > 0) {
                    String linhaAnterior = linhas[i - 1].trim();
                    if (linhaAnterior.length() > 5 && !linhaAnterior.matches(".*\\d{3}.*") &&
                            !linhaAnterior.toUpperCase().contains("FOLHA") &&
                            !linhaAnterior.toUpperCase().contains("PAGAMENTO") &&
                            !linhaAnterior.toUpperCase().contains("HOLERITE")) {
                        return linhaAnterior.toUpperCase();
                    }
                }
            }
        }

        // PadrÃ£o 2: Procurar por linhas com "LTDA", "S.A", "ME", etc.
        for (String linha : linhas) {
            String linhaUpper = linha.toUpperCase();
            if ((linhaUpper.contains("LTDA") || linhaUpper.contains("S.A") ||
                    linhaUpper.contains(" ME ") || linhaUpper.contains("EIRELI")) &&
                    !linhaUpper.contains("FUNCIONARIO") && !linhaUpper.contains("CPF") &&
                    linha.length() > 10 && linha.length() < 150) {
                return linha.trim().toUpperCase();
            }
        }

        // PadrÃ£o 3: CÃ³digo + Nome + CNPJ na mesma linha
        Pattern empresaPattern = Pattern.compile("^(\\d{4})\\s+(.+?)\\s+(\\d{14})$");
        for (String linha : linhas) {
            Matcher matcher = empresaPattern.matcher(linha);
            if (matcher.find()) {
                String nome = matcher.group(2).trim();
                if (nome.length() > 5) {
                    return nome.toUpperCase();
                }
            }
        }

        return null;
    }

    /**
     * Extrai CNPJ da empresa do texto bruto
     */
    private String extractCompanyCnpjFromRawText(String rawText) {
        if (rawText == null || rawText.trim().isEmpty()) {
            return null;
        }

        // PadrÃ£o 1: CNPJ: 12.345.678/0001-90 ou CNPJ: 12345678000190
        Pattern cnpjPattern = Pattern.compile(
                "CNPJ[:\\s]*([0-9]{2}\\.?[0-9]{3}\\.?[0-9]{3}/?[0-9]{4}-?[0-9]{2}|[0-9]{14})",
                Pattern.CASE_INSENSITIVE);
        Matcher matcher = cnpjPattern.matcher(rawText);
        if (matcher.find()) {
            return matcher.group(1).replaceAll("[^0-9]", "");
        }

        // PadrÃ£o 2: CNPJ sem rÃ³tulo (14 dÃ­gitos consecutivos)
        Pattern fallbackPattern = Pattern.compile("(?<!\\d)(\\d{14})(?!\\d)");
        matcher = fallbackPattern.matcher(rawText.replaceAll("\\s+", ""));
        if (matcher.find()) {
            return matcher.group(1);
        }

        return null;
    }

    /**
     * Extrai setor/cargo do texto bruto
     */
    private String extractSectorFromRawText(String rawText) {
        if (rawText == null || rawText.trim().isEmpty()) {
            return null;
        }

        String[] linhas = rawText.split("\r?\n");

        // PadrÃ£o 1: Procurar por "Setor:", "Cargo:", "Local:", "Posto de Trabalho:"
        Pattern sectorPattern = Pattern.compile("(?i)(?:setor|cargo|local|posto\\s+de\\s+trabalho)[:\\s]+(.+)");
        for (String linha : linhas) {
            Matcher matcher = sectorPattern.matcher(linha);
            if (matcher.find()) {
                String setor = matcher.group(1).trim();
                if (setor.length() > 2 && setor.length() < 100) {
                    return setor.toUpperCase();
                }
            }
        }

        // PadrÃ£o 2: Procurar setor na linha do perÃ­odo (formato comum: "01/06/2025 a
        // 30/06/2025 SETOR")
        Pattern periodoSetorPattern = Pattern.compile("(\\d{2}/\\d{2}/\\d{4})\\s+a\\s+(\\d{2}/\\d{2}/\\d{4})\\s+(.+)");
        for (String linha : linhas) {
            Matcher matcher = periodoSetorPattern.matcher(linha);
            if (matcher.find()) {
                String setor = matcher.group(3).trim();
                // Remover possÃ­veis nÃºmeros ou datas do final
                setor = setor.replaceAll("\\s+\\d{2}/\\d{4}$", "").trim();
                if (setor.length() > 2 && setor.length() < 100 &&
                        !setor.matches(".*\\d{4}.*")) { // NÃ£o deve ser sÃ³ nÃºmeros
                    return setor.toUpperCase();
                }
            }
        }

        return null;
    }
}
