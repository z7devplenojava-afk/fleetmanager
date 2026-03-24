package com.z7design.fleet_manager.worker;

import com.z7design.fleet_manager.dto.GeminiOcrResponse;
import com.z7design.fleet_manager.model.DocumentPage;
import com.z7design.fleet_manager.model.DocumentProcessingJob;
import com.z7design.fleet_manager.repository.DocumentPageRepository;
import com.z7design.fleet_manager.repository.DocumentProcessingJobRepository;
import com.z7design.fleet_manager.service.GeminiOcrService;
import com.z7design.fleet_manager.service.MinIOService;
import com.z7design.fleet_manager.service.TesseractService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionSynchronization;

import jakarta.annotation.PostConstruct;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Semaphore;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class OcrWorker {

    private OcrWorker self; // Self-injection para permitir @Transactional em mÃ©todos internos

    @Autowired
    public void setSelf(OcrWorker self) {
        this.self = self;
    }

    private final StringRedisTemplate redisTemplate;
    private final DocumentPageRepository documentPageRepository;
    private final DocumentProcessingJobRepository jobRepository;
    private final GeminiOcrService geminiOcrService;
    private final MinIOService minIOService;
    private final TesseractService tesseractService;

    private static final String STREAM_PAGES = "stream:pages";
    private static final String STREAM_PARSED = "stream:parsed";
    private static final String CONSUMER_GROUP = "ocr-group";
    private static final String CONSUMER_NAME = "ocr-worker-1";

    // SemÃ¡foro para limitar chamadas simultÃ¢neas ao Gemini (rate limiting)
    // Aumentado para 20 para melhor throughput em arquivos grandes
    private final Semaphore semaphore = new Semaphore(20);

    // PadrÃµes regex para extrair dados do texto OCR
    private static final Pattern CPF_PATTERN = Pattern.compile("(\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2})");
    // Melhorado: aceita MM/YYYY, M/YYYY, MM/AAAA, M/AAAA, MM-YYYY, etc.
    private static final Pattern PERIOD_PATTERN = Pattern.compile("(\\d{1,2}[/-]\\d{4})");
    private static final Pattern VALUE_PATTERN = Pattern.compile(
            "(?:R\\$|valor|lÃ­quido|liquido|total\\s+lÃ­quido|total\\s+liquido|lÃ­quido\\s+a\\s+receber|liquido\\s+a\\s+receber)[:\\s]*(\\d{1,3}(?:\\.\\d{3})*(?:,\\d{2})?)",
            Pattern.CASE_INSENSITIVE);

    @PostConstruct
    public void init() {
        log.info(
                "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
        log.info("ðŸŸ¡ OCR WORKER: Iniciando inicializaÃ§Ã£o...");
        log.info(
                "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");

        // InicializaÃ§Ã£o assÃ­ncrona para nÃ£o bloquear o startup do Spring se o Redis
        // estiver fora
        new Thread(() -> {
            try {
                // Tentar criar o group. Se falhar por timeout, o resto do app jÃ¡ subiu.
                redisTemplate.opsForStream().createGroup(STREAM_PAGES, ReadOffset.from("0"), CONSUMER_GROUP);
                log.info("âœ… OCR WORKER: Consumer group '{}' criado/verificado", CONSUMER_GROUP);
            } catch (Exception e) {
                log.info("â„¹ï¸  OCR WORKER: Consumer group '{}' jÃ¡ existe ou erro: {}", CONSUMER_GROUP,
                        e.getMessage());
            }
            log.info("âœ… OCR WORKER: InicializaÃ§Ã£o concluÃ­da - Worker pronto!");
        }).start();

        log.info("ðŸŸ¡ OCR WORKER: InicializaÃ§Ã£o agendada em background.");
    }

    @Scheduled(fixedDelay = 200) // Processa a cada 200ms para maior throughput
    public void processPages() {
        try {
            // Ler mais pÃ¡ginas por vez para arquivos grandes (atÃ© 50 pÃ¡ginas por ciclo)
            @SuppressWarnings("unchecked")
            List<MapRecord<String, String, String>> records = (List<MapRecord<String, String, String>>) (List<?>) redisTemplate
                    .opsForStream().read(
                            org.springframework.data.redis.connection.stream.Consumer.from(CONSUMER_GROUP,
                                    CONSUMER_NAME),
                            org.springframework.data.redis.connection.stream.StreamReadOptions.empty().count(50), // Aumentado
                                                                                                                  // de
                                                                                                                  // 10
                                                                                                                  // para
                                                                                                                  // 50
                            StreamOffset.create(STREAM_PAGES, ReadOffset.lastConsumed()));

            if (records == null || records.isEmpty()) {
                return;
            }

            log.info("ðŸŸ¡ OcrWorker: Processando {} pÃ¡ginas do stream:pages", records.size());
            System.out.println("ðŸŸ¡ OcrWorker: Processando " + records.size() + " pÃ¡ginas do stream:pages");

            // Processar todas as pÃ¡ginas em paralelo (limitado pelo semÃ¡foro)
            for (MapRecord<String, String, String> record : records) {
                // Processar assincronamente para nÃ£o bloquear
                processPageAsync(record);
            }
        } catch (Exception e) {
            log.error("Erro no OcrWorker", e);
        }
    }

    private void processPageAsync(MapRecord<String, String, String> record) {
        try {
            semaphore.acquire();
            // Usar self-injection para garantir que @Transactional funcione
            if (self != null) {
                self.processPageTransactional(record);
            } else {
                // Fallback se self-injection nÃ£o funcionar
                processPage(record);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Thread interrompida", e);
        } catch (Exception e) {
            log.error("Erro ao processar pÃ¡gina", e);
        } finally {
            semaphore.release();
        }
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void processPageTransactional(MapRecord<String, String, String> record) {
        processPage(record);
    }

    private void processPage(MapRecord<String, String, String> record) {
        String jobIdStr = record.getValue().get("jobId");
        String pageIdStr = record.getValue().get("pageId");
        String pageIndexStr = record.getValue().get("pageIndex");
        String s3Url = record.getValue().get("s3Url");

        if (jobIdStr == null || pageIdStr == null || s3Url == null) {
            log.warn("Dados incompletos na mensagem: {}", record.getValue());
            return;
        }

        UUID jobId = UUID.fromString(jobIdStr);
        UUID pageId = UUID.fromString(pageIdStr);
        int pageIndex = Integer.parseInt(pageIndexStr);

        log.info("ðŸŸ¡ OcrWorker: Processando OCR para pÃ¡gina {} do job {} - pageId recebido do stream: {}", pageIndex,
                jobId, pageId);

        try {
            // Buscar o job para obter o documentType
            DocumentProcessingJob job = jobRepository.findById(jobId)
                    .orElseThrow(() -> new RuntimeException("Job nÃ£o encontrado: " + jobId));

            // Obter documentType do job (ou da mensagem como fallback)
            String documentTypeStr = record.getValue().get("documentType");
            if (documentTypeStr == null && job.getDocumentType() != null) {
                documentTypeStr = job.getDocumentType();
            }
            if (documentTypeStr == null) {
                documentTypeStr = "HOLERITE"; // Default
            }

            DocumentPage.DocumentType documentType = documentTypeStr.equalsIgnoreCase("COMPROVANTE")
                    ? DocumentPage.DocumentType.COMPROVANTE
                    : DocumentPage.DocumentType.HOLERITE;

            log.info("ðŸŸ¡ OcrWorker: Tipo de documento definido como {} (do job)", documentType);

            // Baixar imagem do MinIO/S3 (ou localmente)
            byte[] imageBytes = minIOService.downloadBytes(s3Url);
            if (imageBytes == null || imageBytes.length == 0) {
                throw new RuntimeException("Imagem nÃ£o encontrada ou vazia: " + s3Url);
            }

            log.debug("ðŸŸ¡ OcrWorker: Imagem baixada com sucesso ({} bytes)", imageBytes.length);

            // Chamar Gemini OCR
            GeminiOcrResponse ocrResponse = null;
            try {
                ocrResponse = geminiOcrService.extractTextFromImage(imageBytes)
                        .block(java.time.Duration.ofSeconds(30));
            } catch (Exception e) {
                log.warn("âš ï¸ OcrWorker: Erro ao chamar Gemini OCR: {}", e.getMessage());
            }

            // Fallback para Tesseract se Gemini falhar ou retornar baixa confianÃ§a
            if (ocrResponse == null || ocrResponse.getConfidence() == null || ocrResponse.getConfidence() < 0.5) {
                log.warn(
                        "âš ï¸ OcrWorker: Gemini retornou baixa confianÃ§a ou null para pÃ¡gina {} do job {}. Usando Tesseract como fallback.",
                        pageIndex, jobId);
                ocrResponse = extractWithTesseract(imageBytes);
            }

            // Calcular hash da pÃ¡gina
            String hash = calculateHash(imageBytes);

            // Normalizar dados extraÃ­dos
            String normalizedCpf = normalizeCpf(ocrResponse.getCpf());
            String normalizedName = normalizeName(ocrResponse.getName());
            String period = ocrResponse.getPeriod();
            BigDecimal liquidValue = parseValue(ocrResponse.getValueLiquid());
            String rawText = extractRawText(ocrResponse);

            // Normalizar dados de empresa e setor
            String normalizedCompanyName = normalizeName(ocrResponse.getCompanyName());
            String normalizedCompanyCnpj = normalizeCnpj(ocrResponse.getCompanyCnpj());
            String normalizedWorkPostName = normalizeName(ocrResponse.getSector());

            log.info(
                    "ðŸŸ¡ OcrWorker: Dados ANTES da normalizaÃ§Ã£o - CPF: {}, Nome: {}, PerÃ­odo: {}, Valor: {}, Empresa: {}, CNPJ: {}, Setor: {}",
                    ocrResponse.getCpf(), ocrResponse.getName(), ocrResponse.getPeriod(), ocrResponse.getValueLiquid(),
                    ocrResponse.getCompanyName(), ocrResponse.getCompanyCnpj(), ocrResponse.getSector());
            log.info(
                    "ðŸŸ¡ OcrWorker: Dados APÃ“S normalizaÃ§Ã£o - CPF: {}, Nome: {}, PerÃ­odo: {}, Valor: {}, Empresa: {}, CNPJ: {}, Setor: {}",
                    normalizedCpf, normalizedName, period, liquidValue, normalizedCompanyName, normalizedCompanyCnpj,
                    normalizedWorkPostName);

            // Criar DocumentPage com o pageId recebido do stream
            log.info("ðŸŸ¡ OcrWorker: Criando DocumentPage com pageId recebido do stream: {}", pageId);
            DocumentPage documentPage = DocumentPage.builder()
                    .id(pageId) // IMPORTANTE: Usar o pageId recebido do stream (gerado pelo SplitterWorker)
                    .jobId(jobId)
                    .type(documentType)
                    .cpf(normalizedCpf)
                    .name(normalizedName)
                    .period(period)
                    .liquidValue(liquidValue)
                    .pageNumber(pageIndex)
                    .rawText(rawText)
                    .companyName(normalizedCompanyName)
                    .companyCnpj(normalizedCompanyCnpj)
                    .workPostName(normalizedWorkPostName)
                    .ocrConfidence(
                            ocrResponse.getConfidence() != null ? ocrResponse.getConfidence().floatValue() : 0.0f)
                    .hash(hash)
                    .status(ocrResponse.getConfidence() != null && ocrResponse.getConfidence() >= 0.8
                            ? DocumentPage.DocumentPageStatus.OK
                            : DocumentPage.DocumentPageStatus.REVIEW)
                    .s3Url(s3Url)
                    .processedAt(LocalDateTime.now())
                    .build();

            // Salvar no banco com flush para garantir commit imediato
            try {
                // Usar findById para garantir que sempre usamos a mesma entidade (evita
                // duplicatas)
                log.debug("ðŸŸ¡ OcrWorker: Verificando se DocumentPage {} jÃ¡ existe no banco...", pageId);
                DocumentPage existing = documentPageRepository.findById(pageId).orElse(null);
                if (existing != null) {
                    log.info("ðŸŸ¡ OcrWorker: DocumentPage {} jÃ¡ existe. Atualizando campos...", pageId);
                    // Atualizar campos
                    existing.setCpf(normalizedCpf);
                    existing.setName(normalizedName);
                    existing.setPeriod(period);
                    existing.setLiquidValue(liquidValue);
                    existing.setRawText(rawText);
                    existing.setCompanyName(normalizedCompanyName);
                    existing.setCompanyCnpj(normalizedCompanyCnpj);
                    existing.setWorkPostName(normalizedWorkPostName);
                    existing.setOcrConfidence(documentPage.getOcrConfidence());
                    existing.setHash(documentPage.getHash());
                    existing.setStatus(documentPage.getStatus());
                    existing.setProcessedAt(LocalDateTime.now());
                    documentPage = documentPageRepository.saveAndFlush(existing);
                    log.info("âœ… OcrWorker: DocumentPage {} atualizada no banco - ID salvo: {}", pageId,
                            documentPage.getId());
                } else {
                    log.info("ðŸŸ¡ OcrWorker: Criando nova DocumentPage com ID: {} (builder definiu: {})", pageId,
                            documentPage.getId());
                    documentPage = documentPageRepository.saveAndFlush(documentPage);
                    log.info("âœ… OcrWorker: DocumentPage {} criada no banco - ID apÃ³s save: {}", pageId,
                            documentPage.getId());

                    // Verificar se o ID foi preservado (agora deve ser preservado apÃ³s remover
                    // @GeneratedValue)
                    if (!documentPage.getId().equals(pageId)) {
                        log.error(
                                "âŒ OcrWorker: ERRO CRÃTICO - ID da DocumentPage foi alterado! Esperado: {}, Obtido: {}",
                                pageId, documentPage.getId());
                        // Usar o ID salvo no banco para publicaÃ§Ã£o no stream
                        pageId = documentPage.getId();
                    }
                }

                // saveAndFlush() jÃ¡ faz flush dentro da transaÃ§Ã£o, nÃ£o precisamos fazer
                // manualmente
                // O @Transactional garante que o commit serÃ¡ feito ao final do mÃ©todo

                log.info(
                        "âœ… OcrWorker: DocumentPage salva no banco - pageId esperado: {}, pageId salvo: {}, type={}, status={}, cpf={}, name={}",
                        pageId, documentPage.getId(), documentType, documentPage.getStatus(), documentPage.getCpf(),
                        documentPage.getName());
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                log.error("âŒ OcrWorker: Erro de integridade ao salvar DocumentPage - pageId={}, erro={}", pageId,
                        e.getMessage(), e);
                // Tentar salvar novamente com dados mÃ­nimos
                try {
                    DocumentPage minimalPage = DocumentPage.builder()
                            .id(pageId)
                            .jobId(jobId)
                            .type(documentType)
                            .pageNumber(pageIndex)
                            .status(DocumentPage.DocumentPageStatus.ERROR)
                            .s3Url(s3Url)
                            .processedAt(LocalDateTime.now())
                            .build();
                    documentPage = documentPageRepository.saveAndFlush(minimalPage);
                    log.warn("âš ï¸ OcrWorker: DocumentPage salva com dados mÃ­nimos devido a erro de integridade");
                } catch (Exception ex) {
                    log.error("âŒ OcrWorker: Erro crÃ­tico ao salvar DocumentPage mesmo com dados mÃ­nimos", ex);
                    throw e; // Re-throw o erro original
                }
            } catch (Exception e) {
                log.error("âŒ OcrWorker: Erro inesperado ao salvar DocumentPage - pageId={}", pageId, e);
                throw e;
            }

            // Preparar dados para publicaÃ§Ã£o no stream (apÃ³s commit)
            // Usar o ID da entidade salva para garantir consistÃªncia (agora deve ser o
            // mesmo que pageId apÃ³s remover @GeneratedValue)
            final UUID finalPageId = documentPage.getId();
            Map<String, String> parsedFields = new HashMap<>();
            parsedFields.put("jobId", jobId.toString());
            parsedFields.put("pageId", finalPageId.toString());
            parsedFields.put("cpf", documentPage.getCpf() != null ? documentPage.getCpf() : "");
            parsedFields.put("name", documentPage.getName() != null ? documentPage.getName() : "");
            parsedFields.put("value",
                    documentPage.getLiquidValue() != null ? documentPage.getLiquidValue().toString() : "");
            parsedFields.put("period", documentPage.getPeriod() != null ? documentPage.getPeriod() : "");
            parsedFields.put("type", documentPage.getType().name());
            parsedFields.put("confidence", String.valueOf(documentPage.getOcrConfidence()));

            // Publicar no stream APÃ“S o commit da transaÃ§Ã£o
            final var recordIdToAck = record.getId();
            final int finalPageIndex = pageIndex;

            // Verificar se hÃ¡ transaÃ§Ã£o ativa antes de registrar
            if (TransactionSynchronizationManager.isActualTransactionActive()) {
                log.debug(
                        "ðŸŸ¡ OcrWorker: TransaÃ§Ã£o ativa detectada, registrando sincronizaÃ§Ã£o para publicaÃ§Ã£o apÃ³s commit");
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        try {
                            log.info("ðŸŸ¢ OcrWorker: Callback afterCommit() executado - publicando no stream");
                            var messageId = redisTemplate.opsForStream().add(STREAM_PARSED, parsedFields);
                            log.info(
                                    "âœ… OcrWorker: PÃ¡gina {} publicada no stream:parsed com messageId: {} (apÃ³s commit)",
                                    finalPageIndex, messageId);
                            System.out.println("âœ… OcrWorker: PÃ¡gina " + finalPageIndex
                                    + " publicada no stream:parsed (apÃ³s commit)");

                            // ACK da mensagem
                            redisTemplate.opsForStream().acknowledge(STREAM_PAGES, CONSUMER_GROUP, recordIdToAck);
                        } catch (Exception e) {
                            log.error("âŒ OcrWorker: Erro ao publicar no stream apÃ³s commit", e);
                        }
                    }
                });
            } else {
                // Se nÃ£o hÃ¡ transaÃ§Ã£o ativa, publicar imediatamente (nÃ£o deveria
                // acontecer, mas Ã© um fallback)
                log.warn(
                        "âš ï¸ OcrWorker: Nenhuma transaÃ§Ã£o ativa detectada! Publicando imediatamente no stream (isso nÃ£o deveria acontecer)");
                try {
                    var messageId = redisTemplate.opsForStream().add(STREAM_PARSED, parsedFields);
                    log.info("âœ… OcrWorker: PÃ¡gina {} publicada no stream:parsed com messageId: {} (sem transaÃ§Ã£o)",
                            finalPageIndex, messageId);
                    redisTemplate.opsForStream().acknowledge(STREAM_PAGES, CONSUMER_GROUP, recordIdToAck);
                } catch (Exception e) {
                    log.error("âŒ OcrWorker: Erro ao publicar no stream", e);
                }
            }

            log.info("âœ… OcrWorker: PÃ¡gina {} processada com sucesso - ConfianÃ§a: {}, Type: {}, CPF: {}, Nome: {}",
                    pageIndex, documentPage.getOcrConfidence(), documentType, documentPage.getCpf(),
                    documentPage.getName());
            System.out.println("âœ… OcrWorker: PÃ¡gina " + pageIndex + " processada - Type: " + documentType + ", CPF: "
                    + documentPage.getCpf());

        } catch (Exception e) {
            log.error("âŒ OcrWorker: Erro ao processar OCR da pÃ¡gina {} do job {}", pageIndex, jobId, e);
            // Marcar como erro - IMPORTANTE: sempre definir o type (obrigatÃ³rio no banco)
            try {
                DocumentPage.DocumentType defaultType = DocumentPage.DocumentType.HOLERITE;

                DocumentPage errorPage = DocumentPage.builder()
                        .id(pageId)
                        .jobId(jobId)
                        .pageNumber(pageIndex)
                        .type(defaultType) // SEMPRE definir o type (obrigatÃ³rio no banco)
                        .status(DocumentPage.DocumentPageStatus.ERROR)
                        .s3Url(s3Url)
                        .processedAt(LocalDateTime.now())
                        .build();
                documentPageRepository.saveAndFlush(errorPage);
                log.warn("âš ï¸ OcrWorker: PÃ¡gina {} marcada como ERROR e salva no banco (type={})", pageIndex,
                        defaultType);
            } catch (Exception ex) {
                log.error("âŒ OcrWorker: Erro ao salvar pÃ¡gina com erro no banco", ex);
            }
        }
    }

    private String calculateHash(byte[] imageBytes) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hashBytes = md.digest(imageBytes);
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            log.error("Erro ao calcular hash", e);
            return UUID.randomUUID().toString();
        }
    }

    private DocumentPage.DocumentType determineDocumentType(GeminiOcrResponse response) {
        if (response.getDocumentType() != null) {
            String type = response.getDocumentType().toLowerCase();
            if (type.contains("holerite") || type.contains("payslip")) {
                return DocumentPage.DocumentType.HOLERITE;
            } else if (type.contains("comprovante") || type.contains("receipt")) {
                return DocumentPage.DocumentType.COMPROVANTE;
            }
        }
        // Tentar inferir pelo conteÃºdo
        // Por padrÃ£o, assume holerite
        return DocumentPage.DocumentType.HOLERITE;
    }

    private BigDecimal parseValue(String valueStr) {
        if (valueStr == null || valueStr.trim().isEmpty()) {
            return null;
        }
        try {
            // Remover caracteres nÃ£o numÃ©ricos exceto ponto e vÃ­rgula
            String cleaned = valueStr.replaceAll("[^0-9.,]", "").trim();

            // Tratar formato brasileiro: 2.850,26 (ponto = milhar, vÃ­rgula = decimal)
            // Se tem vÃ­rgula, assumir formato brasileiro
            if (cleaned.contains(",")) {
                // Remover pontos (separadores de milhar) e substituir vÃ­rgula por ponto
                cleaned = cleaned.replace(".", "").replace(",", ".");
            } else if (cleaned.contains(".")) {
                // Se sÃ³ tem ponto, verificar se Ã© formato americano (1.23) ou brasileiro
                // (1.234)
                // Se tem mais de 3 dÃ­gitos apÃ³s o Ãºltimo ponto, provavelmente Ã© formato
                // brasileiro
                int lastDotIndex = cleaned.lastIndexOf(".");
                if (lastDotIndex >= 0 && cleaned.length() - lastDotIndex > 4) {
                    // Formato brasileiro: remover pontos
                    cleaned = cleaned.replace(".", "");
                }
                // Caso contrÃ¡rio, manter como estÃ¡ (formato americano)
            }

            if (cleaned.isEmpty()) {
                return null;
            }

            return new BigDecimal(cleaned);
        } catch (Exception e) {
            log.warn("Erro ao parsear valor: {}", valueStr, e);
            return null;
        }
    }

    private String normalizeCpf(String cpf) {
        if (cpf == null) {
            return null;
        }
        // Remover caracteres nÃ£o numÃ©ricos
        return cpf.replaceAll("[^0-9]", "");
    }

    private String normalizeName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return null;
        }
        // Converter para uppercase e remover acentos bÃ¡sicos
        return name.toUpperCase()
                .replace("Ã", "A").replace("Ã€", "A").replace("Ã‚", "A").replace("Ãƒ", "A")
                .replace("Ã‰", "E").replace("ÃŠ", "E")
                .replace("Ã", "I")
                .replace("Ã“", "O").replace("Ã”", "O").replace("Ã•", "O")
                .replace("Ãš", "U").replace("Ãœ", "U")
                .replace("Ã‡", "C")
                .trim();
    }

    private String normalizeCnpj(String cnpj) {
        if (cnpj == null || cnpj.trim().isEmpty()) {
            return null;
        }
        // Remover caracteres nÃ£o numÃ©ricos
        String digitsOnly = cnpj.replaceAll("[^0-9]", "");
        // CNPJ deve ter 14 dÃ­gitos
        return digitsOnly.length() == 14 ? digitsOnly : null;
    }

    private String extractRawText(GeminiOcrResponse response) {
        // Se temos o texto completo do OCR, usar ele (mais Ãºtil para debug e
        // processamento posterior)
        if (response.getFullText() != null && !response.getFullText().trim().isEmpty()) {
            return response.getFullText();
        }

        // Caso contrÃ¡rio, construir texto a partir dos dados extraÃ­dos
        StringBuilder sb = new StringBuilder();
        if (response.getName() != null) {
            sb.append("Nome: ").append(response.getName()).append("\n");
        }
        if (response.getCpf() != null) {
            sb.append("CPF: ").append(response.getCpf()).append("\n");
        }
        if (response.getPeriod() != null) {
            sb.append("PerÃ­odo: ").append(response.getPeriod()).append("\n");
        }
        if (response.getValueLiquid() != null) {
            sb.append("Valor LÃ­quido: ").append(response.getValueLiquid()).append("\n");
        }
        return sb.toString();
    }

    /**
     * Extrai dados usando Tesseract OCR como fallback
     */
    private GeminiOcrResponse extractWithTesseract(byte[] imageBytes) {
        GeminiOcrResponse response = new GeminiOcrResponse();
        response.setConfidence(0.3); // ConfianÃ§a baixa para Tesseract

        try {
            // Converter byte[] para BufferedImage
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(imageBytes));
            if (image == null) {
                log.warn("âš ï¸ OcrWorker: NÃ£o foi possÃ­vel converter bytes para imagem");
                return response;
            }

            // Salvar temporariamente para o Tesseract processar
            Path tempFile = Files.createTempFile("ocr-tesseract-", ".png");
            try {
                ImageIO.write(image, "png", tempFile.toFile());

                // Extrair texto usando Tesseract
                String text = tesseractService.extractTextFromImage(tempFile.toFile());

                if (text != null && !text.trim().isEmpty()) {
                    log.info("âœ… OcrWorker: Tesseract extraiu {} caracteres de texto", text.length());
                    log.debug("ðŸŸ¡ OcrWorker: Primeiros 500 caracteres do texto: {}",
                            text.length() > 500 ? text.substring(0, 500) + "..." : text);

                    // Salvar o texto completo no response
                    response.setFullText(text);

                    // Extrair dados usando regex
                    String extractedCpf = extractCpfFromText(text);
                    String extractedName = extractNameFromText(text);
                    String extractedPeriod = extractPeriodFromText(text);
                    String extractedValue = extractValueFromText(text);

                    response.setCpf(extractedCpf);
                    response.setName(extractedName);
                    response.setPeriod(extractedPeriod);
                    response.setValueLiquid(extractedValue);
                    response.setDocumentType(determineDocumentTypeFromText(text));
                    response.setConfidence(0.5); // ConfianÃ§a mÃ©dia para Tesseract

                    log.info("ðŸŸ¡ OcrWorker: Dados extraÃ­dos - CPF: {}, Nome: {}, PerÃ­odo: {}, Valor: {}",
                            extractedCpf, extractedName, extractedPeriod, extractedValue);

                    if (extractedName == null) {
                        log.warn("âš ï¸ OcrWorker: Nome nÃ£o foi extraÃ­do do texto. Verifique os padrÃµes regex.");
                    }
                    if (extractedValue == null) {
                        log.warn("âš ï¸ OcrWorker: Valor nÃ£o foi extraÃ­do do texto. Verifique os padrÃµes regex.");
                    }
                } else {
                    log.warn("âš ï¸ OcrWorker: Tesseract nÃ£o extraiu texto");
                }
            } finally {
                Files.deleteIfExists(tempFile);
            }
        } catch (Exception e) {
            log.error("âŒ OcrWorker: Erro ao usar Tesseract como fallback", e);
        }

        return response;
    }

    private String extractCpfFromText(String text) {
        Matcher matcher = CPF_PATTERN.matcher(text);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    private String extractNameFromText(String text) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }

        // Lista de palavras/frases que NÃƒO sÃ£o nomes (declaraÃ§Ãµes comuns em
        // holerites)
        String[] invalidPhrases = {
                "DECLARO", "TER", "RECEBIDO", "A", "IMPORTANCIA", "IMPORTÃ‚NCIA", "LIQUIDA", "LÃQUIDA",
                "DISCRIMINADA", "NESTE", "RECIBO", "DEMONSTRATIVO", "PAGAMENTO", "HOLERITE", "COMPROVANTE",
                "TOTAL", "DESCONTO", "PROVENTO", "VALOR", "REF", "COD", "CPF", "CNPJ", "PERIODO", "PERÃODO",
                "EMPRESA", "EMPRESARIAL", "INSCRIÃ‡ÃƒO", "INSCRICAO", "FUNCIONARIO", "FUNCIONÃRIO",
                "COLABORADOR", "EMPREGADO", "CARGO", "DEPARTAMENTO", "SETOR", "ADMISSAO", "ADMISSÃƒO"
        };

        // FunÃ§Ã£o auxiliar para verificar se uma string contÃ©m frases invÃ¡lidas
        java.util.function.Predicate<String> isValidName = (candidate) -> {
            String upper = candidate.toUpperCase().trim();
            // Verificar se contÃ©m alguma frase invÃ¡lida
            for (String phrase : invalidPhrases) {
                if (upper.contains(phrase)) {
                    return false;
                }
            }
            // Verificar se Ã© muito longo (nomes geralmente tÃªm menos de 60 caracteres)
            if (upper.length() > 60) {
                return false;
            }
            // Aceitar nomes com 1 palavra se tiver mais de 8 caracteres
            String[] words = candidate.trim().split("\\s+");
            if (words.length < 1) {
                return false;
            }
            // Se tiver apenas 1 palavra, deve ter pelo menos 8 caracteres
            if (words.length == 1 && candidate.length() < 8) {
                return false;
            }
            // Verificar se cada palavra tem pelo menos 2 letras
            for (String word : words) {
                if (word.length() < 2
                        || !word.matches("^[A-ZÃ€-ÃšÃÃ‚ÃƒÃ‰ÃŠÃÃ“Ã”Ã•ÃšÃ‡a-zÃ -ÃºÃ¡Ã¢Ã£Ã©ÃªÃ­Ã³Ã´ÃµÃºÃ§]+$")) {
                    return false;
                }
            }
            return true;
        };

        // PadrÃ£o 1: "Nome: ..." ou "FuncionÃ¡rio: ..." (mais flexÃ­vel)
        Pattern namePattern1 = Pattern.compile(
                "(?:nome|funcionÃ¡rio|funcionario|colaborador|empregado|empregado)[:\\s]+([A-ZÃ€-ÃšÃÃ‚ÃƒÃ‰ÃŠÃÃ“Ã”Ã•ÃšÃ‡a-zÃ -ÃºÃ¡Ã¢Ã£Ã©ÃªÃ­Ã³Ã´ÃµÃºÃ§]+(?:\\s+[A-ZÃ€-ÃšÃÃ‚ÃƒÃ‰ÃŠÃÃ“Ã”Ã•ÃšÃ‡a-zÃ -ÃºÃ¡Ã¢Ã£Ã©ÃªÃ­Ã³Ã´ÃµÃºÃ§]+){0,5})",
                Pattern.CASE_INSENSITIVE);
        Matcher matcher1 = namePattern1.matcher(text);
        if (matcher1.find()) {
            String name = matcher1.group(1).trim();
            // Remover caracteres especiais e nÃºmeros do final
            name = name.replaceAll("[^A-ZÃ€-ÃšÃÃ‚ÃƒÃ‰ÃŠÃÃ“Ã”Ã•ÃšÃ‡a-zÃ -ÃºÃ¡Ã¢Ã£Ã©ÃªÃ­Ã³Ã´ÃµÃºÃ§\\s]", "").trim();
            if (name.length() >= 3 && isValidName.test(name)) {
                log.debug("ðŸŸ¡ OcrWorker: Nome extraÃ­do (padrÃ£o 1): {}", name);
                return name;
            } else {
                log.debug("ðŸŸ¡ OcrWorker: Nome extraÃ­do (padrÃ£o 1) foi rejeitado: {}", name);
            }
        }

        // PadrÃ£o 2: Linha com apenas letras (comum em holerites) - mais flexÃ­vel
        // Buscar linhas que parecem nomes (1-5 palavras, cada uma com 2-25 letras)
        Pattern namePattern2 = Pattern.compile(
                "^([A-ZÃ€-ÃšÃÃ‚ÃƒÃ‰ÃŠÃÃ“Ã”Ã•ÃšÃ‡][a-zÃ -ÃºÃ¡Ã¢Ã£Ã©ÃªÃ­Ã³Ã´ÃµÃºÃ§]{2,}(?:\\s+[A-ZÃ€-ÃšÃÃ‚ÃƒÃ‰ÃŠÃÃ“Ã”Ã•ÃšÃ‡][a-zÃ -ÃºÃ¡Ã¢Ã£Ã©ÃªÃ­Ã³Ã´ÃµÃºÃ§]{2,}){0,4})$",
                Pattern.MULTILINE);
        Matcher matcher2 = namePattern2.matcher(text);
        while (matcher2.find()) {
            String candidate = matcher2.group(1).trim();
            // Aceitar nomes com 1 palavra se tiver mais de 8 caracteres (ex: "JOSE",
            // "MARIA")
            if (candidate.length() >= 3 && (candidate.split("\\s+").length >= 2 || candidate.length() >= 8)) {
                if (isValidName.test(candidate)) {
                    log.debug("ðŸŸ¡ OcrWorker: Nome extraÃ­do (padrÃ£o 2): {}", candidate);
                    return candidate;
                }
            }
        }

        // PadrÃ£o 3: Primeira linha significativa apÃ³s CPF (mais flexÃ­vel)
        Pattern cpfPattern = Pattern.compile("(\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2})");
        Matcher cpfMatcher = cpfPattern.matcher(text);
        if (cpfMatcher.find()) {
            int cpfStart = cpfMatcher.start();
            int cpfEnd = cpfMatcher.end();
            // Buscar antes e depois do CPF
            String beforeCpf = text.substring(Math.max(0, cpfStart - 200), cpfStart);
            String afterCpf = text.substring(Math.min(cpfEnd, text.length()), Math.min(cpfEnd + 200, text.length()));

            // Buscar em linhas prÃ³ximas ao CPF
            String[] linesBefore = beforeCpf.split("\\n");
            String[] linesAfter = afterCpf.split("\\n");

            // Verificar linhas antes do CPF (Ãºltimas 3 linhas)
            for (int i = Math.max(0, linesBefore.length - 3); i < linesBefore.length; i++) {
                String line = linesBefore[i].trim();
                line = line.replaceAll("[^A-ZÃ€-ÃšÃÃ‚ÃƒÃ‰ÃŠÃÃ“Ã”Ã•ÃšÃ‡a-zÃ -ÃºÃ¡Ã¢Ã£Ã©ÃªÃ­Ã³Ã´ÃµÃºÃ§\\s]", "").trim();
                if (line.length() >= 3 && line.length() <= 80 &&
                        line.matches("^[A-ZÃ€-ÃšÃÃ‚ÃƒÃ‰ÃŠÃÃ“Ã”Ã•ÃšÃ‡a-zÃ -ÃºÃ¡Ã¢Ã£Ã©ÃªÃ­Ã³Ã´ÃµÃºÃ§\\s]+$") &&
                        (line.split("\\s+").length >= 1 || line.length() >= 8) &&
                        isValidName.test(line)) {
                    log.debug("ðŸŸ¡ OcrWorker: Nome extraÃ­do (padrÃ£o 3 - antes CPF): {}", line);
                    return line;
                }
            }

            // Verificar linhas depois do CPF (primeiras 3 linhas)
            for (int i = 0; i < Math.min(3, linesAfter.length); i++) {
                String line = linesAfter[i].trim();
                line = line.replaceAll("[^A-ZÃ€-ÃšÃÃ‚ÃƒÃ‰ÃŠÃÃ“Ã”Ã•ÃšÃ‡a-zÃ -ÃºÃ¡Ã¢Ã£Ã©ÃªÃ­Ã³Ã´ÃµÃºÃ§\\s]", "").trim();
                if (line.length() >= 3 && line.length() <= 80 &&
                        line.matches("^[A-ZÃ€-ÃšÃÃ‚ÃƒÃ‰ÃŠÃÃ“Ã”Ã•ÃšÃ‡a-zÃ -ÃºÃ¡Ã¢Ã£Ã©ÃªÃ­Ã³Ã´ÃµÃºÃ§\\s]+$") &&
                        (line.split("\\s+").length >= 1 || line.length() >= 8) &&
                        isValidName.test(line)) {
                    log.debug("ðŸŸ¡ OcrWorker: Nome extraÃ­do (padrÃ£o 3 - depois CPF): {}", line);
                    return line;
                }
            }
        }

        // PadrÃ£o 4: Buscar nas primeiras linhas do documento (cabeÃ§alho)
        String[] allLines = text.split("\\n");
        for (int i = 0; i < Math.min(10, allLines.length); i++) {
            String line = allLines[i].trim();
            line = line.replaceAll("[^A-ZÃ€-ÃšÃÃ‚ÃƒÃ‰ÃŠÃÃ“Ã”Ã•ÃšÃ‡a-zÃ -ÃºÃ¡Ã¢Ã£Ã©ÃªÃ­Ã³Ã´ÃµÃºÃ§\\s]", "").trim();
            if (line.length() >= 5 && line.length() <= 80 &&
                    line.matches("^[A-ZÃ€-ÃšÃÃ‚ÃƒÃ‰ÃŠÃÃ“Ã”Ã•ÃšÃ‡a-zÃ -ÃºÃ¡Ã¢Ã£Ã©ÃªÃ­Ã³Ã´ÃµÃºÃ§\\s]+$") &&
                    (line.split("\\s+").length >= 2 || line.length() >= 10) &&
                    isValidName.test(line)) {
                log.debug("ðŸŸ¡ OcrWorker: Nome extraÃ­do (padrÃ£o 4 - cabeÃ§alho): {}", line);
                return line;
            }
        }

        log.warn("âš ï¸ OcrWorker: NÃ£o foi possÃ­vel extrair nome do texto");
        return null;
    }

    private String extractPeriodFromText(String text) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }

        // PadrÃ£o 1: MM/YYYY ou M/YYYY (mais comum)
        Matcher matcher = PERIOD_PATTERN.matcher(text);
        if (matcher.find()) {
            String period = matcher.group(1);
            // Normalizar para MM/YYYY
            if (period.contains("-")) {
                period = period.replace("-", "/");
            }
            // Garantir que o mÃªs tenha 2 dÃ­gitos
            String[] parts = period.split("/");
            if (parts.length == 2) {
                int month = Integer.parseInt(parts[0]);
                int year = Integer.parseInt(parts[1]);
                if (month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
                    return String.format("%02d/%04d", month, year);
                }
            }
        }

        // PadrÃ£o 2: Procurar por "ReferÃªncia:", "PerÃ­odo:", "MÃªs/Ano:", etc.
        Pattern periodLabelPattern = Pattern.compile(
                "(?i)(?:referÃªncia|referencia|perÃ­odo|periodo|mÃªs/ano|mes/ano|competÃªncia|competencia)[:\\s]+(\\d{1,2}[/-]\\d{4})");
        matcher = periodLabelPattern.matcher(text);
        if (matcher.find()) {
            String period = matcher.group(1);
            if (period.contains("-")) {
                period = period.replace("-", "/");
            }
            String[] parts = period.split("/");
            if (parts.length == 2) {
                int month = Integer.parseInt(parts[0]);
                int year = Integer.parseInt(parts[1]);
                if (month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
                    return String.format("%02d/%04d", month, year);
                }
            }
        }

        // PadrÃ£o 3: Procurar por datas no formato "01/10/2025 a 31/10/2025" e extrair
        // mÃªs/ano
        Pattern dateRangePattern = Pattern.compile("(\\d{2})/(\\d{2})/(\\d{4})\\s+a\\s+\\d{2}/\\d{2}/\\d{4}");
        matcher = dateRangePattern.matcher(text);
        if (matcher.find()) {
            int month = Integer.parseInt(matcher.group(2));
            int year = Integer.parseInt(matcher.group(3));
            if (month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
                return String.format("%02d/%04d", month, year);
            }
        }

        return null;
    }

    private String extractValueFromText(String text) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }

        // Tentar mÃºltiplos padrÃµes para encontrar o valor lÃ­quido
        // PadrÃ£o 1: "R$ X.XXX,XX" ou "Valor LÃ­quido: X.XXX,XX"
        Matcher matcher1 = VALUE_PATTERN.matcher(text);
        if (matcher1.find()) {
            String value = matcher1.group(1);
            log.debug("ðŸŸ¡ OcrWorker: Valor extraÃ­do (padrÃ£o 1): {}", value);
            return value;
        }

        // PadrÃ£o 2: "LÃ­quido a Receber: X.XXX,XX"
        Pattern valuePattern2 = Pattern.compile(
                "(?:lÃ­quido\\s+a\\s+receber|liquido\\s+a\\s+receber|total\\s+lÃ­quido|total\\s+liquido)[:\\s]+(\\d{1,3}(?:\\.\\d{3})*(?:,\\d{2})?)",
                Pattern.CASE_INSENSITIVE);
        Matcher matcher2 = valuePattern2.matcher(text);
        if (matcher2.find()) {
            String value = matcher2.group(1);
            log.debug("ðŸŸ¡ OcrWorker: Valor extraÃ­do (padrÃ£o 2): {}", value);
            return value;
        }

        // PadrÃ£o 3: Qualquer nÃºmero grande com formato monetÃ¡rio (Ãºltimo nÃºmero
        // grande encontrado)
        Pattern valuePattern3 = Pattern.compile("(\\d{1,3}(?:\\.\\d{3})*(?:,\\d{2}))");
        Matcher matcher3 = valuePattern3.matcher(text);
        String lastValue = null;
        while (matcher3.find()) {
            lastValue = matcher3.group(1);
        }
        if (lastValue != null) {
            log.debug("ðŸŸ¡ OcrWorker: Valor extraÃ­do (padrÃ£o 3 - Ãºltimo nÃºmero grande): {}", lastValue);
            return lastValue;
        }

        log.warn("âš ï¸ OcrWorker: NÃ£o foi possÃ­vel extrair valor do texto");
        return null;
    }

    private String determineDocumentTypeFromText(String text) {
        String lowerText = text.toLowerCase();
        if (lowerText.contains("holerite") || lowerText.contains("demonstrativo de pagamento")) {
            return "HOLERITE";
        } else if (lowerText.contains("comprovante") || lowerText.contains("recibo")) {
            return "COMPROVANTE";
        }
        return "HOLERITE"; // PadrÃ£o
    }
}
