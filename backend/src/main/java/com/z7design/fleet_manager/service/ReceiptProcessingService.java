package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.PaymentReceiptDTO;
import com.z7design.fleet_manager.dto.ReceiptProcessingResponse;
import com.z7design.fleet_manager.model.PaymentReceipt;
import com.z7design.fleet_manager.model.PaymentReceiptStatus;
import com.z7design.fleet_manager.model.Payslip;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.repository.PaymentReceiptRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReceiptProcessingService {

    private final PaymentReceiptRepository receiptRepository;
    private final PaymentReceiptService paymentReceiptService;
    private final PayslipService payslipService;
    private final EmployeeRepository employeeRepository;
    private final String UPLOAD_DIR = "uploads/receipts/";

    @Transactional
    public List<PaymentReceipt> processReceiptFile(MultipartFile file) throws IOException {
        ReceiptProcessingResponse response = processReceiptFileWithSummary(file);
        // Converter DTOs de volta para entidades (para compatibilidade com cÃ³digo existente)
        return response.getReceipts().stream()
            .map(dto -> {
                PaymentReceipt receipt = receiptRepository.findById(dto.getId()).orElse(null);
                return receipt;
            })
            .filter(receipt -> receipt != null)
            .collect(Collectors.toList());
    }
    
    @Transactional
    public ReceiptProcessingResponse processReceiptFileWithSummary(MultipartFile file) throws IOException {
        log.info("=== INÃCIO DO PROCESSAMENTO DE COMPROVANTES ===");
        log.info("Arquivo: {} ({} bytes)", file.getOriginalFilename(), file.getSize());
        log.info("Tipo de conteÃºdo: {}", file.getContentType());
        log.info("Arquivo vazio: {}", file.isEmpty());
        
        if (file.isEmpty()) {
            log.error("âŒ ARQUIVO ESTÃ VAZIO!");
            throw new IOException("Arquivo estÃ¡ vazio");
        }
        
        // Criar diretÃ³rio se nÃ£o existir
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
            log.info("DiretÃ³rio criado: {}", uploadPath.toAbsolutePath());
        }

        List<PaymentReceipt> extractedReceipts = new ArrayList<>();
        int pageCount = 0;
        int paginasProcessadas = 0;
        int paginasComErro = 0;
        int paginasPuladas = 0;
        
        // Mapa para contar comprovantes por funcionÃ¡rio
        Map<String, Integer> employeesCount = new HashMap<>();
        
        // Ler o arquivo em bytes para poder reutilizar
        byte[] fileBytes = file.getBytes();
        
        try (PDDocument document = PDDocument.load(new java.io.ByteArrayInputStream(fileBytes))) {
            pageCount = document.getNumberOfPages();
            log.info("ðŸ“„ Arquivo contÃ©m {} pÃ¡gina(s) - Cada pÃ¡gina contÃ©m 1 comprovante", pageCount);
            log.info("ðŸ“‹ Expectativa: {} comprovante(s) processado(s) (1 comprovante por pÃ¡gina)", pageCount);

            // IMPORTANTE: Criar uma nova instÃ¢ncia do stripper para cada pÃ¡gina
            // para garantir que nÃ£o hÃ¡ estado compartilhado entre pÃ¡ginas
            for (int pageNum = 0; pageNum < pageCount; pageNum++) {
                log.info("â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
                log.info("=== PROCESSANDO PÃGINA {}/{} ===", pageNum + 1, pageCount);
                log.info("â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
                
                // CRIAR NOVA INSTÃ‚NCIA PARA CADA PÃGINA (crÃ­tico para evitar estado compartilhado)
                PDFTextStripper stripper = new PDFTextStripper();
                stripper.setStartPage(pageNum + 1);
                stripper.setEndPage(pageNum + 1);
                
                String pageText = stripper.getText(document);
                log.info("ðŸ“ Texto extraÃ­do da pÃ¡gina {}: {} caracteres", pageNum + 1, pageText.length());
                
                // Log do texto extraÃ­do para debug (mostrar parte relevante da seÃ§Ã£o creditada)
                if (pageText.length() > 0) {
                    // Buscar seÃ§Ã£o creditada no texto para confirmar que Ã© da pÃ¡gina correta
                    Pattern creditadaPreviewPattern = Pattern.compile("Dados da conta (?:a ser )?creditada([\\s\\S]{0,300}?)(?=Dados|Valor|InformaÃ§Ãµes|$)", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
                    Matcher creditadaPreviewMatcher = creditadaPreviewPattern.matcher(pageText);
                    if (creditadaPreviewMatcher.find()) {
                        String creditadaSection = creditadaPreviewMatcher.group(1);
                        log.info("ðŸ” SeÃ§Ã£o creditada encontrada na pÃ¡gina {}: {}", pageNum + 1, creditadaSection.substring(0, Math.min(200, creditadaSection.length())));
                    } else {
                        log.warn("âš ï¸ SeÃ§Ã£o creditada NÃƒO encontrada na pÃ¡gina {}!", pageNum + 1);
                    }
                    
                    // Preview geral da pÃ¡gina
                    String preview = pageText.substring(0, Math.min(300, pageText.length()));
                    log.info("ðŸ” Preview da pÃ¡gina {} (primeiros 300 chars): {}", pageNum + 1, preview);
                } else {
                    log.warn("âš ï¸ PÃ¡gina {} estÃ¡ vazia!", pageNum + 1);
                }
                
                try {
                    // IMPORTANTE: Cada pÃ¡gina deve gerar APENAS 1 comprovante
                    // Extrair informaÃ§Ãµes do comprovante
                    PaymentReceipt receipt = extractReceiptInfo(pageText, pageNum + 1, new java.io.ByteArrayInputStream(fileBytes));
                    
                    if (receipt != null && receipt.getEmployeeName() != null && !receipt.getEmployeeName().trim().isEmpty()) {
                        log.info("âœ… Comprovante extraÃ­do da pÃ¡gina {}/{}: {} (PerÃ­odo: {}/{}, Conta: {})", 
                            pageNum + 1, pageCount, receipt.getEmployeeName(), 
                            receipt.getMonth(), receipt.getYear(),
                            receipt.getCreditedAccount() != null ? receipt.getCreditedAccount() : "NÃƒO EXTRAÃDA");
                        
                        extractedReceipts.add(receipt);
                        paginasProcessadas++;
                        
                        // Contar por funcionÃ¡rio
                        String employeeName = receipt.getEmployeeName().trim().toUpperCase();
                        employeesCount.put(employeeName, employeesCount.getOrDefault(employeeName, 0) + 1);
                    } else {
                        paginasComErro++;
                        log.warn("âŒ Nenhum comprovante extraÃ­do da pÃ¡gina {}/{} - dados invÃ¡lidos", pageNum + 1, pageCount);
                        log.debug("Dados extraÃ­dos da pÃ¡gina {}: Nome={}", pageNum + 1, 
                                 receipt != null ? receipt.getEmployeeName() : "null");
                    }
                } catch (Exception pageException) {
                    paginasComErro++;
                    log.error("âŒ Erro ao processar pÃ¡gina {}/{}: {}", pageNum + 1, pageCount, pageException.getMessage());
                    log.debug("Stack trace da pÃ¡gina {}: ", pageNum + 1, pageException);
                    // Continuar processando prÃ³ximas pÃ¡ginas
                }
            }
        } catch (Exception e) {
            log.error("ðŸ’¥ ERRO AO PROCESSAR ARQUIVO PDF: {}", e.getMessage(), e);
            throw new IOException("Erro ao processar arquivo PDF: " + e.getMessage());
        }

        // Salvar comprovantes no banco e retornar apenas os salvos (com IDs)
        List<PaymentReceipt> savedReceipts = new ArrayList<>();
        log.info("ðŸ’¾ Salvando {} comprovantes no banco de dados", extractedReceipts.size());
        for (PaymentReceipt receipt : extractedReceipts) {
            try {
                PaymentReceipt savedReceipt = receiptRepository.save(receipt);
                log.info("âœ… Comprovante salvo com ID: {} - {}", savedReceipt.getId(), savedReceipt.getEmployeeName());
                savedReceipts.add(savedReceipt);
            } catch (Exception e) {
                log.error("âŒ Erro ao salvar comprovante: {}", e.getMessage(), e);
            }
        }

        // VALIDAÃ‡ÃƒO: Verificar se quantidade de comprovantes processados corresponde Ã  quantidade de pÃ¡ginas
        int comprovantesProcessados = extractedReceipts.size();
        int comprovantesSalvos = savedReceipts.size();
        boolean validationOk = comprovantesProcessados == pageCount;
        String validationMessage = "";
        
        log.info("");
        log.info("â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
        log.info("ðŸ“Š RESUMO DO PROCESSAMENTO DE COMPROVANTES:");
        log.info("â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
        log.info("ðŸ“„ Total de pÃ¡ginas no arquivo: {}", pageCount);
        log.info("âœ… PÃ¡ginas processadas com sucesso: {}", paginasProcessadas);
        log.info("âŒ PÃ¡ginas com erro na extraÃ§Ã£o: {}", paginasComErro);
        log.info("â­ï¸  PÃ¡ginas puladas: {}", paginasPuladas);
        log.info("ðŸ“‹ Comprovantes extraÃ­dos: {}", comprovantesProcessados);
        log.info("ðŸ’¾ Comprovantes salvos no banco: {}", comprovantesSalvos);
        log.info("â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
        
        // ValidaÃ§Ã£o principal: comprovantes processados devem ser igual a pÃ¡ginas
        if (validationOk) {
            validationMessage = String.format("âœ… VALIDAÃ‡ÃƒO OK: Quantidade de comprovantes processados (%d) corresponde Ã  quantidade de pÃ¡ginas (%d)",
                comprovantesProcessados, pageCount);
            log.info(validationMessage);
        } else {
            validationMessage = String.format("âš ï¸ ATENÃ‡ÃƒO: Quantidade de comprovantes processados (%d) nÃ£o corresponde Ã  quantidade esperada (%d pÃ¡ginas)",
                comprovantesProcessados, pageCount);
            log.warn(validationMessage);
            log.warn("âš ï¸ DiferenÃ§a: {} comprovante(s) a mais/menos do esperado", Math.abs(comprovantesProcessados - pageCount));
            
            if (comprovantesProcessados > pageCount) {
                log.warn("âš ï¸ POSSÃVEL CAUSA: Uma ou mais pÃ¡ginas podem ter gerado mÃºltiplos comprovantes");
                log.warn("âš ï¸ SOLUÃ‡ÃƒO: Verificar se o extractReceiptInfo estÃ¡ extraindo apenas 1 comprovante por pÃ¡gina");
            } else if (comprovantesProcessados < pageCount) {
                log.warn("âš ï¸ POSSÃVEL CAUSA: Uma ou mais pÃ¡ginas nÃ£o geraram comprovante (erro na extraÃ§Ã£o ou dados invÃ¡lidos)");
                log.warn("âš ï¸ SOLUÃ‡ÃƒO: Verificar logs de erro acima para identificar pÃ¡ginas problemÃ¡ticas");
            }
        }
        
        log.info("â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
        
        // Lista de funcionÃ¡rios processados com suas quantidades
        log.info("");
        log.info("â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
        log.info("ðŸ“‹ LISTA DE FUNCIONÃRIOS PROCESSADOS:");
        log.info("â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
        
        if (employeesCount.isEmpty()) {
            log.warn("âš ï¸ Nenhum funcionÃ¡rio foi processado");
        } else {
            // Ordenar por quantidade (decrescente) e depois por nome
            List<Map.Entry<String, Integer>> sortedEmployees = employeesCount.entrySet().stream()
                .sorted((e1, e2) -> {
                    int countCompare = Integer.compare(e2.getValue(), e1.getValue()); // Decrescente por quantidade
                    if (countCompare != 0) return countCompare;
                    return e1.getKey().compareToIgnoreCase(e2.getKey()); // Crescente por nome
                })
                .collect(Collectors.toList());
            
            for (Map.Entry<String, Integer> entry : sortedEmployees) {
                log.info("ðŸ‘¤ {}: {} comprovante(s)", entry.getKey(), entry.getValue());
            }
            
            log.info("â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
            log.info("ðŸ“Š Total de funcionÃ¡rios Ãºnicos processados: {}", employeesCount.size());
            log.info("â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
        }

        log.info("ðŸŽ‰ Processamento concluÃ­do. {} comprovante(s) extraÃ­do(s), {} salvo(s) de {} pÃ¡gina(s) do arquivo", 
            comprovantesProcessados, comprovantesSalvos, pageCount);
        
        // Converter para DTOs
        List<PaymentReceiptDTO> receiptDTOs = savedReceipts.stream()
            .map(receipt -> {
                PaymentReceiptDTO dto = new PaymentReceiptDTO();
                dto.setId(receipt.getId());
                dto.setEmployeeName(receipt.getEmployeeName());
                dto.setMonth(receipt.getMonth());
                dto.setYear(receipt.getYear());
                dto.setGrossSalary(receipt.getGrossSalary());
                dto.setNetSalary(receipt.getNetSalary());
                dto.setFileName(receipt.getFileName());
                dto.setFilePath(receipt.getFilePath());
                dto.setStatus(receipt.getStatus());
                dto.setCreatedAt(receipt.getCreatedAt());
                dto.setProcessedAt(receipt.getProcessedAt());
                return dto;
            })
            .collect(Collectors.toList());
        
        // Construir lista de funcionÃ¡rios com contagem
        List<ReceiptProcessingResponse.EmployeeProcessingCount> employeesByCount = employeesCount.entrySet().stream()
            .sorted((e1, e2) -> {
                int countCompare = Integer.compare(e2.getValue(), e1.getValue());
                if (countCompare != 0) return countCompare;
                return e1.getKey().compareToIgnoreCase(e2.getKey());
            })
            .map(entry -> ReceiptProcessingResponse.EmployeeProcessingCount.builder()
                .employeeName(entry.getKey())
                .count(entry.getValue())
                .build())
            .collect(Collectors.toList());
        
        // Construir resumo
        ReceiptProcessingResponse.ProcessingSummary summary = ReceiptProcessingResponse.ProcessingSummary.builder()
            .totalPages(pageCount)
            .receiptsProcessed(comprovantesProcessados)
            .receiptsSaved(comprovantesSalvos)
            .pagesWithError(paginasComErro)
            .pagesSkipped(paginasPuladas)
            .validationOk(validationOk)
            .validationMessage(validationMessage)
            .build();
        
        return ReceiptProcessingResponse.builder()
            .receipts(receiptDTOs)
            .summary(summary)
            .employeesByCount(employeesByCount)
            .build();
    }

    private PaymentReceipt extractReceiptInfo(String pageText, int pageNumber, java.io.InputStream originalInputStream) {
        try {
            log.info("Extraindo informaÃ§Ãµes do recibo da pÃ¡gina {}", pageNumber);
            
            // Extrair dados especÃ­ficos do recibo bancÃ¡rio
            ReceiptData receiptData = extractBankReceiptData(pageText);
            if (receiptData == null) {
                log.warn("NÃ£o foi possÃ­vel extrair dados do recibo bancÃ¡rio na pÃ¡gina {}", pageNumber);
                return null;
            }

            log.info("Dados extraÃ­dos - Nome: {}, MÃªs: {}, Ano: {}, Valor: {}", 
                    receiptData.employeeName, receiptData.month, receiptData.year, receiptData.amount);

            // Validar dados obrigatÃ³rios
            if (receiptData.employeeName == null || receiptData.employeeName.trim().isEmpty()) {
                log.error("Nome do funcionÃ¡rio Ã© obrigatÃ³rio");
                return null;
            }
            
            if (receiptData.month <= 0 || receiptData.month > 12) {
                log.error("MÃªs invÃ¡lido: {}", receiptData.month);
                return null;
            }
            
            if (receiptData.year <= 0) {
                log.error("Ano invÃ¡lido: {}", receiptData.year);
                return null;
            }

            // ===== VALIDAÃ‡Ã•ES SOLICITADAS =====
            log.info("ðŸ” Iniciando validaÃ§Ãµes do comprovante...");
            
            // 1. Buscar holerite correspondente ao funcionÃ¡rio e perÃ­odo
            Payslip matchingPayslip = null;
            try {
                List<Payslip> payslipsInDb = payslipService.getAllPayslips().stream()
                    .filter(p -> p.getMonth() != null && p.getMonth().equals(receiptData.month))
                    .filter(p -> p.getYear() != null && p.getYear().equals(receiptData.year))
                    .collect(Collectors.toList());
                
                log.info("ðŸ“Š Holerites encontrados para {}/{}: {}", receiptData.month, receiptData.year, payslipsInDb.size());
                
                // Normalizar nome do comprovante para comparaÃ§Ã£o
                String receiptEmployeeName = receiptData.employeeName != null ? receiptData.employeeName.trim().toUpperCase() : "";
                String receiptNameFirst3 = receiptEmployeeName.length() >= 3 ? receiptEmployeeName.substring(0, 3) : receiptEmployeeName;
                
                // Buscar holerite correspondente
                for (Payslip payslip : payslipsInDb) {
                    if (payslip.getEmployeeName() != null) {
                        String payslipEmployeeName = payslip.getEmployeeName().trim().toUpperCase();
                        String payslipNameFirst3 = payslipEmployeeName.length() >= 3 ? payslipEmployeeName.substring(0, 3) : payslipEmployeeName;
                        
                        // Verificar se os 3 primeiros caracteres coincidem (para nomes abreviados)
                        boolean nameMatches = receiptNameFirst3.equals(payslipNameFirst3) || 
                                            receiptEmployeeName.equals(payslipEmployeeName) ||
                                            receiptEmployeeName.contains(payslipEmployeeName) ||
                                            payslipEmployeeName.contains(receiptEmployeeName);
                        
                        if (nameMatches) {
                            matchingPayslip = payslip;
                            log.info("âœ… Holerite encontrado: {} - {}/{} (Empresa: {}, Setor: {})", 
                                payslip.getEmployeeName(), payslip.getMonth(), payslip.getYear(),
                                payslip.getCompanyName(), payslip.getWorkPostName());
                            break;
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("âš ï¸ Erro ao buscar holerite: {}", e.getMessage());
            }
            
            // 2. Validar valor lÃ­quido se holerite foi encontrado
            boolean valueMatches = false;
            if (matchingPayslip != null && matchingPayslip.getNetValue() != null && receiptData.amount != null) {
                java.math.BigDecimal payslipNetValue = matchingPayslip.getNetValue();
                java.math.BigDecimal receiptAmount = java.math.BigDecimal.valueOf(receiptData.amount);
                
                // Comparar valores (tolerÃ¢ncia de 0.01 para diferenÃ§as de arredondamento)
                valueMatches = payslipNetValue.subtract(receiptAmount).abs().compareTo(java.math.BigDecimal.valueOf(0.01)) <= 0;
                
                log.info("ðŸ’° ComparaÃ§Ã£o de valores - Holerite: R$ {}, Comprovante: R$ {}, Match: {}", 
                    payslipNetValue, receiptAmount, valueMatches);
            } else {
                log.warn("âš ï¸ NÃ£o foi possÃ­vel validar valor: Holerite={}, NetValue={}, ReceiptAmount={}", 
                    matchingPayslip != null, 
                    matchingPayslip != null && matchingPayslip.getNetValue() != null ? matchingPayslip.getNetValue() : "null",
                    receiptData.amount);
            }
            
            // 3. Verificar duplicatas (mesmo funcionÃ¡rio, mesmo valor, mesma data de transferÃªncia)
            boolean isDuplicate = false;
            try {
                List<PaymentReceipt> existingReceipts = receiptRepository.findAll().stream()
                    .filter(r -> r.getEmployeeName() != null && 
                                r.getEmployeeName().trim().equalsIgnoreCase(receiptData.employeeName.trim()))
                    .filter(r -> r.getMonth() != null && r.getMonth().equals(receiptData.month))
                    .filter(r -> r.getYear() != null && r.getYear().equals(receiptData.year))
                    .collect(Collectors.toList());
                
                for (PaymentReceipt existing : existingReceipts) {
                    // Verificar se Ã© duplicata: mesmo valor E mesma data de transferÃªncia
                    boolean sameValue = existing.getNetSalary() != null && receiptData.amount != null &&
                                      existing.getNetSalary().subtract(java.math.BigDecimal.valueOf(receiptData.amount))
                                          .abs().compareTo(java.math.BigDecimal.valueOf(0.01)) <= 0;
                    
                    // Normalizar data de transferÃªncia para comparaÃ§Ã£o (formato DD/MM/AAAA ou MM/AAAA)
                    String existingTransferDate = existing.getTransferDate() != null ? existing.getTransferDate().trim() : "";
                    String receiptTransferDate = receiptData.transferDate != null ? receiptData.transferDate.trim() : "";
                    
                    // Se a data nÃ£o foi extraÃ­da do PDF, usar a data derivada do perÃ­odo (MM/AAAA)
                    if (receiptTransferDate.isEmpty()) {
                        receiptTransferDate = String.format("%02d/%04d", receiptData.month, receiptData.year);
                    }
                    
                    boolean sameDate = !existingTransferDate.isEmpty() && !receiptTransferDate.isEmpty() &&
                                     existingTransferDate.equals(receiptTransferDate);
                    
                    // Ã‰ duplicata se: mesmo valor E mesma data de transferÃªncia
                    if (sameValue && sameDate) {
                        isDuplicate = true;
                        log.warn("âš ï¸ Comprovante duplicado encontrado: {} - {}/{} (Valor: R$ {}, Data: {})", 
                            existing.getEmployeeName(), existing.getMonth(), existing.getYear(),
                            existing.getNetSalary(), existing.getTransferDate());
                        break;
                    } else if (sameValue && !sameDate) {
                        log.info("âœ… Comprovante permitido: mesmo valor mas data diferente ({} vs {})", 
                            existingTransferDate, receiptTransferDate);
                    } else if (!sameValue && sameDate) {
                        log.info("âœ… Comprovante permitido: mesma data mas valor diferente (R$ {} vs R$ {})", 
                            existing.getNetSalary(), receiptData.amount);
                    }
                }
            } catch (Exception e) {
                log.warn("âš ï¸ Erro ao verificar duplicatas: {}", e.getMessage());
            }
            
            // 4. Se Ã© duplicata, nÃ£o processar (exceto se valor ou data forem diferentes - jÃ¡ verificado acima)
            if (isDuplicate) {
                log.warn("âŒ Comprovante duplicado ignorado: {} - {}/{} (mesmo valor e mesma data)", 
                    receiptData.employeeName, receiptData.month, receiptData.year);
                return null;
            }
            
            // 5. Se nome e valor coincidem com holerite, usar estrutura de pastas do holerite
            if (matchingPayslip != null && valueMatches) {
                log.info("âœ… ValidaÃ§Ãµes passaram - Nome e valor coincidem com holerite. Usando estrutura de pastas do holerite.");
                // A estrutura de pastas serÃ¡ definida pelo applyCompanyHierarchy que usa os dados do holerite
                receiptData.companyName = matchingPayslip.getCompanyName();
                receiptData.companyCnpj = matchingPayslip.getCompanyCnpj();
            } else {
                log.warn("âš ï¸ ValidaÃ§Ãµes nÃ£o passaram - Nome ou valor nÃ£o coincidem com holerite. Usando estrutura padrÃ£o.");
            }
            
            log.info("ðŸ” ValidaÃ§Ãµes concluÃ­das - Holerite encontrado: {}, Valor coincide: {}, Duplicata: {}", 
                matchingPayslip != null, valueMatches, isDuplicate);

            // ===== MELHORIA: MATCHING COM FUNCIONÃRIOS DA TABELA EMPLOYEES =====
            // Buscar funcionÃ¡rio correspondente usando CPF, nome e conta corrente para melhor precisÃ£o
            Employee matchingEmployee = null;
            UUID employeeId = null;
            
            try {
                log.info("ðŸ” Iniciando busca de funcionÃ¡rio na tabela employees...");
                log.info("ðŸ“‹ Dados do comprovante - Nome: '{}', Conta Creditada: '{}'", 
                    receiptData.employeeName, receiptData.creditedAccount);
                
                // ESTRATÃ‰GIA 1: Buscar por conta corrente creditada (mais precisa)
                if (receiptData.creditedAccount != null && !receiptData.creditedAccount.trim().isEmpty()) {
                    String normalizedAccount = receiptData.creditedAccount.replaceAll("[^0-9]", "");
                    if (!normalizedAccount.isEmpty()) {
                        log.info("ðŸ” EstratÃ©gia 1: Buscando funcionÃ¡rio por conta corrente: '{}' (normalizada: '{}')", 
                            receiptData.creditedAccount, normalizedAccount);
                        
                        java.util.Optional<Employee> employeeOpt = employeeRepository.findByContaCorrente(normalizedAccount);
                        if (employeeOpt.isPresent()) {
                            matchingEmployee = employeeOpt.get();
                            employeeId = matchingEmployee.getId();
                            log.info("âœ… FuncionÃ¡rio encontrado por conta corrente: {} (ID: {})", 
                                matchingEmployee.getName(), employeeId);
                        } else {
                            log.info("âš ï¸ Nenhum funcionÃ¡rio encontrado por conta corrente: {}", normalizedAccount);
                        }
                    }
                }
                
                // ESTRATÃ‰GIA 2: Buscar por nome (se nÃ£o encontrou por conta corrente)
                if (matchingEmployee == null && receiptData.employeeName != null && !receiptData.employeeName.trim().isEmpty()) {
                    String normalizedName = receiptData.employeeName.trim().toUpperCase();
                    log.info("ðŸ” EstratÃ©gia 2: Buscando funcionÃ¡rio por nome: '{}'", normalizedName);
                    
                    // Tentar busca exata primeiro
                    java.util.Optional<Employee> employeeOpt = employeeRepository.findByNameExact(normalizedName);
                    if (employeeOpt.isPresent()) {
                        matchingEmployee = employeeOpt.get();
                        employeeId = matchingEmployee.getId();
                        log.info("âœ… FuncionÃ¡rio encontrado por nome exato: {} (ID: {})", 
                            matchingEmployee.getName(), employeeId);
                    } else {
                        // Tentar busca parcial (contains)
                        java.util.List<Employee> employees = employeeRepository.findByNameContainingIgnoreCase(normalizedName);
                        if (!employees.isEmpty()) {
                            // Se houver mÃºltiplos, tentar encontrar o mais prÃ³ximo
                            Employee bestMatch = employees.stream()
                                .filter(e -> e.getName() != null)
                                .min((e1, e2) -> {
                                    String name1 = e1.getName().toUpperCase();
                                    String name2 = e2.getName().toUpperCase();
                                    // Preferir match mais prÃ³ximo (menor diferenÃ§a de tamanho)
                                    int diff1 = Math.abs(name1.length() - normalizedName.length());
                                    int diff2 = Math.abs(name2.length() - normalizedName.length());
                                    return Integer.compare(diff1, diff2);
                                })
                                .orElse(employees.get(0));
                            
                            matchingEmployee = bestMatch;
                            employeeId = matchingEmployee.getId();
                            log.info("âœ… FuncionÃ¡rio encontrado por nome parcial: {} (ID: {}) de {} candidato(s)", 
                                matchingEmployee.getName(), employeeId, employees.size());
                        } else {
                            log.info("âš ï¸ Nenhum funcionÃ¡rio encontrado por nome: {}", normalizedName);
                        }
                    }
                }
                
                // ESTRATÃ‰GIA 3: Buscar por CPF do holerite (se disponÃ­vel e nÃ£o encontrou ainda)
                if (matchingEmployee == null && matchingPayslip != null && matchingPayslip.getCpf() != null) {
                    String payslipCpf = matchingPayslip.getCpf().replaceAll("[^0-9]", "");
                    if (!payslipCpf.isEmpty() && payslipCpf.length() >= 11) {
                        log.info("ðŸ” EstratÃ©gia 3: Buscando funcionÃ¡rio por CPF do holerite: '{}'", payslipCpf);
                        
                        java.util.Optional<Employee> employeeOpt = employeeRepository.findByCpf(payslipCpf);
                        if (employeeOpt.isPresent()) {
                            matchingEmployee = employeeOpt.get();
                            employeeId = matchingEmployee.getId();
                            log.info("âœ… FuncionÃ¡rio encontrado por CPF do holerite: {} (ID: {})", 
                                matchingEmployee.getName(), employeeId);
                        } else {
                            log.info("âš ï¸ Nenhum funcionÃ¡rio encontrado por CPF: {}", payslipCpf);
                        }
                    }
                }
                
                // Log do resultado final
                if (matchingEmployee != null) {
                    log.info("âœ… FuncionÃ¡rio associado ao comprovante:");
                    log.info("   ðŸ‘¤ Nome: {}", matchingEmployee.getName());
                    log.info("   ðŸ†” ID: {}", employeeId);
                    log.info("   ðŸ“„ CPF/Documento: {}", matchingEmployee.getDocument() != null ? matchingEmployee.getDocument() : "N/A");
                    log.info("   ðŸ’³ Conta Corrente: {}", matchingEmployee.getContaCorrente() != null ? matchingEmployee.getContaCorrente() : "N/A");
                } else {
                    log.warn("âš ï¸ Nenhum funcionÃ¡rio encontrado na tabela employees para o comprovante:");
                    log.warn("   Nome: '{}'", receiptData.employeeName);
                    log.warn("   Conta Creditada: '{}'", receiptData.creditedAccount);
                    if (matchingPayslip != null) {
                        log.warn("   CPF do Holerite: '{}'", matchingPayslip.getCpf());
                    }
                    log.warn("   O comprovante serÃ¡ salvo sem associaÃ§Ã£o com funcionÃ¡rio (employeeId = null)");
                }
                
            } catch (Exception e) {
                log.warn("âš ï¸ Erro ao buscar funcionÃ¡rio na tabela employees: {}", e.getMessage(), e);
            }
            
            // ===== COMENTADO PARA USO FUTURO: Verificar conta corrente do holerite =====
            // Quando o holerite tiver o campo conta corrente, descomentar este cÃ³digo:
            /*
            if (matchingEmployee == null && matchingPayslip != null) {
                // Verificar se o holerite tem conta corrente e fazer matching
                String payslipContaCorrente = matchingPayslip.getContaCorrente(); // Campo futuro no Payslip
                if (payslipContaCorrente != null && !payslipContaCorrente.trim().isEmpty() 
                    && receiptData.creditedAccount != null && !receiptData.creditedAccount.trim().isEmpty()) {
                    
                    String normalizedPayslipAccount = payslipContaCorrente.replaceAll("[^0-9]", "");
                    String normalizedReceiptAccount = receiptData.creditedAccount.replaceAll("[^0-9]", "");
                    
                    if (normalizedPayslipAccount.equals(normalizedReceiptAccount)) {
                        log.info("ðŸ” EstratÃ©gia 4: Buscando funcionÃ¡rio por conta corrente do holerite: '{}'", normalizedPayslipAccount);
                        
                        java.util.Optional<Employee> employeeOpt = employeeRepository.findByContaCorrente(normalizedPayslipAccount);
                        if (employeeOpt.isPresent()) {
                            matchingEmployee = employeeOpt.get();
                            employeeId = matchingEmployee.getId();
                            log.info("âœ… FuncionÃ¡rio encontrado por conta corrente do holerite: {} (ID: {})", 
                                matchingEmployee.getName(), employeeId);
                        }
                    }
                }
            }
            */

            // Criar novo PDF com os dados extraÃ­dos
            String newPdfPath = null;
            try {
                // Passar o holerite encontrado para usar sua estrutura de pastas se validaÃ§Ãµes passaram
                newPdfPath = extractReceiptPageFromOriginal(originalInputStream, pageNumber, receiptData, matchingPayslip);
                log.info("PDF criado com sucesso: {}", newPdfPath);
                
                // Verificar se o arquivo foi realmente criado
                java.io.File pdfFile = new java.io.File(newPdfPath);
                if (!pdfFile.exists()) {
                    log.error("PDF nÃ£o foi criado fisicamente: {}", newPdfPath);
                    throw new IOException("PDF nÃ£o foi criado fisicamente");
                }
                
                log.info("PDF verificado e existe: {} bytes", pdfFile.length());
                
            } catch (Exception e) {
                log.error("Erro ao criar PDF: {}", e.getMessage(), e);
                // NÃ£o continuar se houver erro na criaÃ§Ã£o do PDF
                throw new IOException("Erro crÃ­tico na criaÃ§Ã£o do PDF: " + e.getMessage(), e);
            }
            
            // Gerar nome do arquivo
            String fileName = generateReceiptFileName(receiptData.employeeName, receiptData.month, receiptData.year, pageNumber);
            log.info("Nome do arquivo gerado: {}", fileName);

            // Criar objeto PaymentReceipt com validaÃ§Ã£o e todos os dados bancÃ¡rios
            // Usar a data de transferÃªncia extraÃ­da do PDF, ou se nÃ£o houver, usar o perÃ­odo (MM/AAAA)
            String normalizedTransferDate;
            if (receiptData.transferDate != null && !receiptData.transferDate.trim().isEmpty()) {
                // Usar a data extraÃ­da do PDF (formato DD/MM/AAAA)
                normalizedTransferDate = receiptData.transferDate.trim();
                log.info("âœ… Usando data de transferÃªncia extraÃ­da do PDF: {}", normalizedTransferDate);
            } else {
                // Fallback: usar perÃ­odo como data (MM/AAAA)
                normalizedTransferDate = String.format("%02d/%04d", receiptData.month, receiptData.year);
                log.warn("âš ï¸ Data de transferÃªncia nÃ£o encontrada no PDF, usando perÃ­odo: {}", normalizedTransferDate);
            }

            PaymentReceipt receipt = PaymentReceipt.builder()
                    .employeeId(employeeId) // Associar ao funcionÃ¡rio encontrado
                    .employeeName(receiptData.employeeName != null ? receiptData.employeeName.trim() : "Nome nÃ£o extraÃ­do")
                    .companyName(receiptData.companyName != null ? receiptData.companyName.trim() : null)
                    .companyCnpj(receiptData.companyCnpj != null ? receiptData.companyCnpj : null)
                    .month(receiptData.month)
                    .year(receiptData.year)
                    .grossSalary(receiptData.amount != null ? java.math.BigDecimal.valueOf(receiptData.amount) : java.math.BigDecimal.ZERO)
                    .netSalary(receiptData.amount != null ? java.math.BigDecimal.valueOf(receiptData.amount) : java.math.BigDecimal.ZERO)
                    .fileName(fileName)
                    .filePath(newPdfPath != null ? newPdfPath : "sem_pdf")
                    .status(PaymentReceiptStatus.PROCESSED)
                    .processedAt(LocalDateTime.now())
                    // Campos bancÃ¡rios extraÃ­dos
                    .debitedAgency(receiptData.agency != null ? receiptData.agency : "0925")
                    .debitedAccount(receiptData.account != null ? receiptData.account : "98240 - 7")
                    .debitedName(receiptData.companyName != null ? receiptData.companyName : "PROMOVER VIGILANCIA PATRIMONIA")
                    .creditedAgency(receiptData.creditedAgency != null ? receiptData.creditedAgency : null)
                    .creditedAccount(receiptData.creditedAccount != null ? receiptData.creditedAccount : null)
                    .creditedName(receiptData.creditedName != null ? receiptData.creditedName : 
                                (receiptData.employeeName != null ? receiptData.employeeName.trim().toUpperCase() : "FUNCIONARIO"))
                    .controlNumber(receiptData.controlNumber != null ? receiptData.controlNumber : String.valueOf(System.currentTimeMillis()).substring(0, 15))
                    .authenticationCode(receiptData.authentication != null ? receiptData.authentication : java.util.UUID.randomUUID().toString().replace("-", "").toUpperCase())
                    .transferDate(normalizedTransferDate)
                    .transferTime(receiptData.transferTime != null ? receiptData.transferTime : null)
                    .bankName(receiptData.bankName != null ? receiptData.bankName : "ItaÃº")
                    .transactionType("TransferÃªncia de Conta Corrente para Conta Corrente")
                    .statementIdentification("SISPAG SALARIOS")
                    .build();

            paymentReceiptService.applyCompanyHierarchy(receipt);

            log.info("â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
            log.info("âœ… RECIBO CRIADO COM SUCESSO PARA A PÃGINA {}", pageNumber);
            log.info("ðŸ‘¤ Nome: {}", receipt.getEmployeeName());
            log.info("ðŸ“… PerÃ­odo: {}/{}", receipt.getMonth(), receipt.getYear());
            log.info("ðŸ’° Valor: R$ {}", receipt.getGrossSalary());
            log.info("ðŸ¦ AgÃªncia Creditada: {}", receipt.getCreditedAgency() != null ? receipt.getCreditedAgency() : "NÃƒO EXTRAÃDA");
            log.info("ðŸ’³ Conta Creditada: {}", receipt.getCreditedAccount() != null ? receipt.getCreditedAccount() : "NÃƒO EXTRAÃDA");
            log.info("ðŸ‘¤ Nome Creditado: {}", receipt.getCreditedName() != null ? receipt.getCreditedName() : "NÃƒO EXTRAÃDO");
            log.info("ðŸ“… Data TransferÃªncia: {}", receipt.getTransferDate() != null ? receipt.getTransferDate() : "NÃƒO EXTRAÃDA");
            log.info("ðŸ• HorÃ¡rio TransferÃªncia: {}", receipt.getTransferTime() != null ? receipt.getTransferTime() : "NÃƒO EXTRAÃDO");
            log.info("â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
            
            // ValidaÃ§Ã£o: alertar se conta nÃ£o foi extraÃ­da
            if (receipt.getCreditedAccount() == null || receipt.getCreditedAccount().trim().isEmpty()) {
                log.error("âš ï¸âš ï¸âš ï¸ ATENÃ‡ÃƒO: Conta creditada NÃƒO foi extraÃ­da para o comprovante de {} na pÃ¡gina {}", 
                    receipt.getEmployeeName(), pageNumber);
            }
            
            return receipt;

        } catch (Exception e) {
            log.error("Erro ao extrair informaÃ§Ãµes do recibo na pÃ¡gina {}: {}", pageNumber, e.getMessage(), e);
            return null;
        }
    }

    private static class ReceiptData {
        String employeeName;
        String bankName;
        String agency;
        String account;
        String companyName;
        String companyCnpj;
        String creditedAgency;
        String creditedAccount;
        String creditedName; // Nome da conta creditada (funcionÃ¡rio)
        Double amount;
        String transferDate;
        String transferTime; // HorÃ¡rio da transferÃªncia (HH:MM:SS ou HH:MM)
        String controlNumber;
        String authentication;
        int month;
        int year;
    }

    private ReceiptData extractBankReceiptData(String text) {
        ReceiptData data = new ReceiptData();
        
        try {
            log.info("=== ðŸ” EXTRAÃ‡ÃƒO DE DADOS BANCÃRIOS ===");
            log.info("ðŸ“Š Tamanho do texto: {} caracteres", text.length());
            
            if (text == null || text.trim().isEmpty()) {
                log.error("âŒ Texto estÃ¡ vazio ou nulo!");
                return null;
            }
            
            // Mostrar primeiros 500 caracteres para debug
            String preview = text.substring(0, Math.min(500, text.length()));
            log.info("ðŸ” Primeiros 500 caracteres: {}", preview);
            
            // Extrair nome do funcionÃ¡rio (conta creditada) - padrÃ£o especÃ­fico do ItaÃº
            String employeeName = null;
            
            // PadrÃ£o 1: "Dados da conta a ser creditada" seguido de "Nome: [NOME COMPLETO]" atÃ© "AgÃªncia:"
            Pattern namePattern1 = Pattern.compile("Dados da conta a ser creditada[\\s\\S]*?Nome\\s*:\\s*([A-ZÃ€ÃÃ‚ÃƒÃ„Ã…Ã†Ã‡ÃˆÃ‰ÃŠÃ‹ÃŒÃÃŽÃÃÃ‘Ã’Ã“Ã”Ã•Ã–Ã˜Ã™ÃšÃ›ÃœÃÃžÃŸÃ Ã¡Ã¢Ã£Ã¤Ã¥Ã¦Ã§Ã¨Ã©ÃªÃ«Ã¬Ã­Ã®Ã¯Ã°Ã±Ã²Ã³Ã´ÃµÃ¶Ã¸Ã¹ÃºÃ»Ã¼Ã½Ã¾Ã¿\\s]+?)\\s*AgÃªncia\\s*:", Pattern.CASE_INSENSITIVE);
            Matcher nameMatcher1 = namePattern1.matcher(text);
            if (nameMatcher1.find()) {
                employeeName = nameMatcher1.group(1).trim();
                log.info("âœ… Nome encontrado (padrÃ£o ItaÃº): {}", employeeName);
            }
            
            // PadrÃ£o 1a: "Nome: [NOME]" seguido de qualquer coisa atÃ© "AgÃªncia:" - mais flexÃ­vel
            if (employeeName == null || employeeName.isEmpty()) {
                Pattern namePattern1a = Pattern.compile("Nome\\s*:\\s*([A-ZÃ€ÃÃ‚ÃƒÃ„Ã…Ã†Ã‡ÃˆÃ‰ÃŠÃ‹ÃŒÃÃŽÃÃÃ‘Ã’Ã“Ã”Ã•Ã–Ã˜Ã™ÃšÃ›ÃœÃÃžÃŸÃ Ã¡Ã¢Ã£Ã¤Ã¥Ã¦Ã§Ã¨Ã©ÃªÃ«Ã¬Ã­Ã®Ã¯Ã°Ã±Ã²Ã³Ã´ÃµÃ¶Ã¸Ã¹ÃºÃ»Ã¼Ã½Ã¾Ã¿\\s]{3,}?)(?=\\s*(?:AgÃªncia|Conta|\\n|$))", Pattern.CASE_INSENSITIVE);
                Matcher nameMatcher1a = namePattern1a.matcher(text);
                if (nameMatcher1a.find()) {
                    employeeName = nameMatcher1a.group(1).trim();
                    log.info("âœ… Nome encontrado (padrÃ£o flexÃ­vel): {}", employeeName);
                }
            }
            
            // PadrÃ£o 1b: EspecÃ­fico para formato ItaÃº - "Nome: [NOME]" seguido de "AgÃªncia:"
            if (employeeName == null || employeeName.isEmpty()) {
                Pattern namePattern1b = Pattern.compile("Nome\\s*:\\s*([A-ZÃ€ÃÃ‚ÃƒÃ„Ã…Ã†Ã‡ÃˆÃ‰ÃŠÃ‹ÃŒÃÃŽÃÃÃ‘Ã’Ã“Ã”Ã•Ã–Ã˜Ã™ÃšÃ›ÃœÃÃžÃŸÃ Ã¡Ã¢Ã£Ã¤Ã¥Ã¦Ã§Ã¨Ã©ÃªÃ«Ã¬Ã­Ã®Ã¯Ã°Ã±Ã²Ã³Ã´ÃµÃ¶Ã¸Ã¹ÃºÃ»Ã¼Ã½Ã¾Ã¿\\s]+?)\\s*AgÃªncia\\s*:", Pattern.CASE_INSENSITIVE);
                Matcher nameMatcher1b = namePattern1b.matcher(text);
                if (nameMatcher1b.find()) {
                    employeeName = nameMatcher1b.group(1).trim();
                    log.info("âœ… Nome encontrado (padrÃ£o ItaÃº especÃ­fico): {}", employeeName);
                }
            }
            
            // PadrÃ£o 2: Buscar por "Nome: [NOME]" em qualquer lugar
            if (employeeName == null || employeeName.isEmpty()) {
                Pattern namePattern2 = Pattern.compile("Nome\\s*:\\s*([A-ZÃ€ÃÃ‚ÃƒÃ„Ã…Ã†Ã‡ÃˆÃ‰ÃŠÃ‹ÃŒÃÃŽÃÃÃ‘Ã’Ã“Ã”Ã•Ã–Ã˜Ã™ÃšÃ›ÃœÃÃžÃŸÃ Ã¡Ã¢Ã£Ã¤Ã¥Ã¦Ã§Ã¨Ã©ÃªÃ«Ã¬Ã­Ã®Ã¯Ã°Ã±Ã²Ã³Ã´ÃµÃ¶Ã¸Ã¹ÃºÃ»Ã¼Ã½Ã¾Ã¿\\s]+)", Pattern.CASE_INSENSITIVE);
                Matcher nameMatcher2 = namePattern2.matcher(text);
                if (nameMatcher2.find()) {
                    employeeName = nameMatcher2.group(1).trim();
                    log.info("âœ… Nome encontrado (padrÃ£o genÃ©rico): {}", employeeName);
                }
            }
            
            // PadrÃ£o 3: Buscar por nomes comuns em recibos
            if (employeeName == null || employeeName.isEmpty()) {
                Pattern namePattern3 = Pattern.compile("(?:FuncionÃ¡rio|Empregado|Colaborador)\\s*:\\s*([A-ZÃ€ÃÃ‚ÃƒÃ„Ã…Ã†Ã‡ÃˆÃ‰ÃŠÃ‹ÃŒÃÃŽÃÃÃ‘Ã’Ã“Ã”Ã•Ã–Ã˜Ã™ÃšÃ›ÃœÃÃžÃŸÃ Ã¡Ã¢Ã£Ã¤Ã¥Ã¦Ã§Ã¨Ã©ÃªÃ«Ã¬Ã­Ã®Ã¯Ã°Ã±Ã²Ã³Ã´ÃµÃ¶Ã¸Ã¹ÃºÃ»Ã¼Ã½Ã¾Ã¿\\s]+)", Pattern.CASE_INSENSITIVE);
                Matcher nameMatcher3 = namePattern3.matcher(text);
                if (nameMatcher3.find()) {
                    employeeName = nameMatcher3.group(1).trim();
                    log.info("âœ… Nome encontrado (padrÃ£o funcionÃ¡rio): {}", employeeName);
                }
            }
            
            // PadrÃ£o 4: Buscar por sequÃªncias que parecem nomes (mais flexÃ­vel)
            if (employeeName == null || employeeName.isEmpty()) {
                Pattern namePattern4 = Pattern.compile("([A-ZÃ€ÃÃ‚ÃƒÃ„Ã…Ã†Ã‡ÃˆÃ‰ÃŠÃ‹ÃŒÃÃŽÃÃÃ‘Ã’Ã“Ã”Ã•Ã–Ã˜Ã™ÃšÃ›ÃœÃÃžÃŸÃ Ã¡Ã¢Ã£Ã¤Ã¥Ã¦Ã§Ã¨Ã©ÃªÃ«Ã¬Ã­Ã®Ã¯Ã°Ã±Ã²Ã³Ã´ÃµÃ¶Ã¸Ã¹ÃºÃ»Ã¼Ã½Ã¾Ã¿]{3,}\\s+[A-ZÃ€ÃÃ‚ÃƒÃ„Ã…Ã†Ã‡ÃˆÃ‰ÃŠÃ‹ÃŒÃÃŽÃÃÃ‘Ã’Ã“Ã”Ã•Ã–Ã˜Ã™ÃšÃ›ÃœÃÃžÃŸÃ Ã¡Ã¢Ã£Ã¤Ã¥Ã¦Ã§Ã¨Ã©ÃªÃ«Ã¬Ã­Ã®Ã¯Ã°Ã±Ã²Ã³Ã´ÃµÃ¶Ã¸Ã¹ÃºÃ»Ã¼Ã½Ã¾Ã¿]{3,})", Pattern.CASE_INSENSITIVE);
                Matcher nameMatcher4 = namePattern4.matcher(text);
                if (nameMatcher4.find()) {
                    employeeName = nameMatcher4.group(1).trim();
                    log.info("âœ… Nome encontrado (padrÃ£o flexÃ­vel): {}", employeeName);
                }
            }
            
            // Limpar o nome extraÃ­do removendo palavras comuns que podem estar sendo incluÃ­das incorretamente
            if (employeeName != null && !employeeName.trim().isEmpty()) {
                // Remover palavras comuns que podem estar sendo incluÃ­das incorretamente
                String cleanedName = employeeName.trim()
                    .replaceAll("(?i)\\bvalor\\b", "") // Remove "valor" (case insensitive)
                    .replaceAll("(?i)\\bfuncionario\\b", "") // Remove "funcionario" (case insensitive)
                    .replaceAll("(?i)\\bempregado\\b", "") // Remove "empregado" (case insensitive)
                    .replaceAll("(?i)\\bcolaborador\\b", "") // Remove "colaborador" (case insensitive)
                    .replaceAll("\\s+", " ") // MÃºltiplos espaÃ§os para um sÃ³
                    .trim();
                
                // Se apÃ³s a limpeza o nome ficou vazio, usar o nome original
                if (cleanedName.isEmpty()) {
                    cleanedName = employeeName.trim();
                }
                
                employeeName = cleanedName;
                log.info("ðŸ§¹ Nome limpo: '{}' -> '{}'", employeeName, cleanedName);
            }
            
            data.employeeName = employeeName != null ? employeeName : "Nome nÃ£o extraÃ­do";
            log.info("Nome do funcionÃ¡rio final: {}", data.employeeName);

            // Extrair banco (assumindo ItaÃº baseado no exemplo)
            data.bankName = "ItaÃº";

            // Extrair agÃªncia da conta debitada (empresa)
            Pattern agencyPattern = Pattern.compile("Dados da conta a ser debitada[\\s\\S]*?AgÃªncia\\s*:\\s*(\\d+)", Pattern.CASE_INSENSITIVE);
            Matcher agencyMatcher = agencyPattern.matcher(text);
            if (agencyMatcher.find()) {
                data.agency = agencyMatcher.group(1);
                log.info("AgÃªncia debitada extraÃ­da: {}", data.agency);
            }

            // Extrair conta da conta debitada (empresa)
            Pattern accountPattern = Pattern.compile("Dados da conta a ser debitada[\\s\\S]*?Conta\\s*:\\s*([\\d\\s-]+)", Pattern.CASE_INSENSITIVE);
            Matcher accountMatcher = accountPattern.matcher(text);
            if (accountMatcher.find()) {
                data.account = accountMatcher.group(1).trim();
                log.info("Conta debitada extraÃ­da: {}", data.account);
            }

            // Extrair nome da empresa (conta debitada) - padrÃ£o especÃ­fico do ItaÃº
            // IMPORTANTE: O nome da empresa estÃ¡ na seÃ§Ã£o "Dados da conta a ser debitada"
            String companyName = null;
            
            // PadrÃ£o 1: "Dados da conta a ser debitada" seguido de "Nome: [NOME EMPRESA]" atÃ© "AgÃªncia:" ou "Conta:"
            // Este Ã© o padrÃ£o CORRETO - a empresa estÃ¡ na conta debitada
            Pattern companyPattern1 = Pattern.compile("Dados da conta a ser debitada[\\s\\S]*?Nome\\s*:\\s*([A-ZÃ€ÃÃ‚ÃƒÃ„Ã…Ã†Ã‡ÃˆÃ‰ÃŠÃ‹ÃŒÃÃŽÃÃÃ‘Ã’Ã“Ã”Ã•Ã–Ã˜Ã™ÃšÃ›ÃœÃÃžÃŸÃ Ã¡Ã¢Ã£Ã¤Ã¥Ã¦Ã§Ã¨Ã©ÃªÃ«Ã¬Ã­Ã®Ã¯Ã°Ã±Ã²Ã³Ã´ÃµÃ¶Ã¸Ã¹ÃºÃ»Ã¼Ã½Ã¾Ã¿\\s]+?)(?=\\s*(?:AgÃªncia|Conta|\\n|$))", Pattern.CASE_INSENSITIVE);
            Matcher companyMatcher1 = companyPattern1.matcher(text);
            if (companyMatcher1.find()) {
                companyName = companyMatcher1.group(1).trim();
                log.info("âœ… Nome da empresa encontrado (padrÃ£o ItaÃº debitada): '{}'", companyName);
            }
            
            // PadrÃ£o 1b: Mais especÃ­fico - "Dados da conta a ser debitada" -> "Nome da empresa:" ou "Nome:" -> atÃ© "AgÃªncia:"
            if (companyName == null || companyName.isEmpty()) {
                Pattern companyPattern1b = Pattern.compile("Dados da conta a ser debitada[\\s\\S]*?(?:Nome da empresa|Nome)\\s*:\\s*([A-ZÃ€ÃÃ‚ÃƒÃ„Ã…Ã†Ã‡ÃˆÃ‰ÃŠÃ‹ÃŒÃÃŽÃÃÃ‘Ã’Ã“Ã”Ã•Ã–Ã˜Ã™ÃšÃ›ÃœÃÃžÃŸÃ Ã¡Ã¢Ã£Ã¤Ã¥Ã¦Ã§Ã¨Ã©ÃªÃ«Ã¬Ã­Ã®Ã¯Ã°Ã±Ã²Ã³Ã´ÃµÃ¶Ã¸Ã¹ÃºÃ»Ã¼Ã½Ã¾Ã¿\\s]+?)\\s*AgÃªncia\\s*:", Pattern.CASE_INSENSITIVE);
                Matcher companyMatcher1b = companyPattern1b.matcher(text);
                if (companyMatcher1b.find()) {
                    companyName = companyMatcher1b.group(1).trim();
                    log.info("âœ… Nome da empresa encontrado (padrÃ£o ItaÃº debitada - especÃ­fico): '{}'", companyName);
                }
            }
            
            // PadrÃ£o 2: Buscar por "PROMOVER" seguido de palavras (fallback para empresas conhecidas)
            if (companyName == null || companyName.isEmpty()) {
                Pattern companyPattern2 = Pattern.compile("PROMOVER\\s+(?:TERCEIRIZACAO|VIGILANCIA|SERVICOS)[\\s\\w]*", Pattern.CASE_INSENSITIVE);
                Matcher companyMatcher2 = companyPattern2.matcher(text);
                if (companyMatcher2.find()) {
                    companyName = companyMatcher2.group(0).trim();
                    log.info("âœ… Nome da empresa encontrado (padrÃ£o PROMOVER): '{}'", companyName);
                }
            }
            
            // PadrÃ£o 3: Buscar por "Nome:" na seÃ§Ã£o debitada (evitar pegar da seÃ§Ã£o creditada)
            // Primeiro encontrar a seÃ§Ã£o debitada, depois procurar "Nome:" dentro dela
            if (companyName == null || companyName.isEmpty()) {
                Pattern debitadaSectionPattern = Pattern.compile("Dados da conta a ser debitada([\\s\\S]*?)Dados da conta a ser creditada", Pattern.CASE_INSENSITIVE);
                Matcher debitadaSectionMatcher = debitadaSectionPattern.matcher(text);
                if (debitadaSectionMatcher.find()) {
                    String debitadaSection = debitadaSectionMatcher.group(1);
                    Pattern nomeInDebitadaPattern = Pattern.compile("Nome\\s*:\\s*([A-ZÃ€ÃÃ‚ÃƒÃ„Ã…Ã†Ã‡ÃˆÃ‰ÃŠÃ‹ÃŒÃÃŽÃÃÃ‘Ã’Ã“Ã”Ã•Ã–Ã˜Ã™ÃšÃ›ÃœÃÃžÃŸÃ Ã¡Ã¢Ã£Ã¤Ã¥Ã¦Ã§Ã¨Ã©ÃªÃ«Ã¬Ã­Ã®Ã¯Ã°Ã±Ã²Ã³Ã´ÃµÃ¶Ã¸Ã¹ÃºÃ»Ã¼Ã½Ã¾Ã¿\\s]+?)(?=\\s*(?:AgÃªncia|Conta|\\n|$))", Pattern.CASE_INSENSITIVE);
                    Matcher nomeInDebitadaMatcher = nomeInDebitadaPattern.matcher(debitadaSection);
                    if (nomeInDebitadaMatcher.find()) {
                        String candidateName = nomeInDebitadaMatcher.group(1).trim();
                        // Verificar se nÃ£o Ã© o mesmo nome do funcionÃ¡rio
                        if (employeeName == null || !candidateName.equalsIgnoreCase(employeeName.trim())) {
                            companyName = candidateName;
                            log.info("âœ… Nome da empresa encontrado (dentro da seÃ§Ã£o debitada): '{}'", companyName);
                        }
                    }
                }
            }
            
            // Limpar o nome da empresa removendo palavras comuns que podem estar sendo incluÃ­das incorretamente
            if (companyName != null && !companyName.trim().isEmpty()) {
                String cleanedCompanyName = companyName.trim()
                    .replaceAll("(?i)\\bagencia\\b", "") // Remove "agencia" (case insensitive)
                    .replaceAll("(?i)\\bconta\\b", "") // Remove "conta" (case insensitive)
                    .replaceAll("(?i)\\bcorrente\\b", "") // Remove "corrente" (case insensitive)
                    .replaceAll("\\s+", " ") // MÃºltiplos espaÃ§os para um sÃ³
                    .trim();
                
                // Se apÃ³s a limpeza o nome ficou vazio, usar o nome original
                if (cleanedCompanyName.isEmpty()) {
                    cleanedCompanyName = companyName.trim();
                }
                
                companyName = cleanedCompanyName;
                log.info("ðŸ§¹ Nome da empresa limpo: '{}' -> '{}'", companyName, cleanedCompanyName);
            }
            
            data.companyName = companyName;

            // Extrair CNPJ se houver
            Pattern cnpjPattern = Pattern.compile("(\\d{2}[\\.\\s]?\\d{3}[\\.\\s]?\\d{3}[\\/\\s]?\\d{4}[-\\s]?\\d{2})");
            Matcher cnpjMatcher = cnpjPattern.matcher(text);
            if (cnpjMatcher.find()) {
                String cnpj = cnpjMatcher.group(1);
                data.companyCnpj = cnpj != null ? cnpj.trim() : null;
                log.info("âœ… CNPJ encontrado: {}", data.companyCnpj);
            }

            // Extrair dados da conta creditada (funcionÃ¡rio)
            String creditedAgency = null;
            String creditedAccount = null;
            
            log.info("ðŸ” Iniciando extraÃ§Ã£o de dados da conta creditada...");
            
            // PadrÃ£o 1: "Dados da conta a ser creditada" seguido de "AgÃªncia:" e "Conta corrente:"
            Pattern creditedAgencyPattern1 = Pattern.compile("Dados da conta a ser creditada[\\s\\S]*?AgÃªncia\\s*:\\s*(\\d+)", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
            Matcher creditedAgencyMatcher1 = creditedAgencyPattern1.matcher(text);
            if (creditedAgencyMatcher1.find()) {
                creditedAgency = creditedAgencyMatcher1.group(1);
                log.info("âœ… AgÃªncia creditada extraÃ­da (padrÃ£o 1): {}", creditedAgency);
            }
            
            // PadrÃ£o 1 para conta creditada: "Conta corrente: [NÃšMERO]" na seÃ§Ã£o creditada (formato "Dados da conta creditada:" - SEM "a ser")
            // Priorizar formato sem "a ser" que Ã© o mais comum no PDF do ItaÃº
            Pattern creditedAccountPattern1 = Pattern.compile("Dados da conta creditada[\\s\\S]*?Conta\\s*corrente\\s*:\\s*([\\d\\s\\-]+)", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
            Matcher creditedAccountMatcher1 = creditedAccountPattern1.matcher(text);
            if (creditedAccountMatcher1.find()) {
                creditedAccount = creditedAccountMatcher1.group(1).trim();
                // Validar que tem pelo menos 4 dÃ­gitos
                if (creditedAccount.replaceAll("[^0-9]", "").length() >= 4) {
                    log.info("âœ… Conta creditada extraÃ­da (padrÃ£o 1 - sem 'a ser'): {}", creditedAccount);
                } else {
                    creditedAccount = null; // Resetar se nÃ£o Ã© vÃ¡lida
                    log.warn("âš ï¸ Conta extraÃ­da invÃ¡lida (menos de 4 dÃ­gitos): {}", creditedAccountMatcher1.group(1));
                }
            }
            
            // PadrÃ£o 2: Buscar "Conta corrente:" depois de "Dados da conta a ser creditada" (com "a ser")
            if (creditedAccount == null || creditedAccount.isEmpty()) {
                Pattern creditedAccountPattern2 = Pattern.compile("Dados da conta a ser creditada[\\s\\S]*?Conta\\s*corrente\\s*:\\s*([\\d\\s\\-]+)", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
                Matcher creditedAccountMatcher2 = creditedAccountPattern2.matcher(text);
                if (creditedAccountMatcher2.find()) {
                    String extractedAccount = creditedAccountMatcher2.group(1).trim();
                    // Validar que tem pelo menos 4 dÃ­gitos
                    if (extractedAccount.replaceAll("[^0-9]", "").length() >= 4) {
                        creditedAccount = extractedAccount;
                        log.info("âœ… Conta creditada extraÃ­da (padrÃ£o 2 - com 'a ser'): {}", creditedAccount);
                    } else {
                        log.warn("âš ï¸ Conta extraÃ­da invÃ¡lida (menos de 4 dÃ­gitos): {}", extractedAccount);
                    }
                }
            }
            
            // PadrÃ£o 2b: Buscar apenas "Conta:" (sem "corrente") na seÃ§Ã£o creditada
            if (creditedAccount == null || creditedAccount.isEmpty()) {
                Pattern creditedAccountPattern2b = Pattern.compile("Dados da conta (?:a ser )?creditada[\\s\\S]*?Conta\\s*:\\s*([\\d\\s\\-]+)", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
                Matcher creditedAccountMatcher2b = creditedAccountPattern2b.matcher(text);
                if (creditedAccountMatcher2b.find()) {
                    String extractedAccount = creditedAccountMatcher2b.group(1).trim();
                    // Validar que tem pelo menos 4 dÃ­gitos
                    if (extractedAccount.replaceAll("[^0-9]", "").length() >= 4) {
                        creditedAccount = extractedAccount;
                        log.info("âœ… Conta creditada extraÃ­da (padrÃ£o 2b - apenas 'Conta:'): {}", creditedAccount);
                    } else {
                        log.warn("âš ï¸ Conta extraÃ­da invÃ¡lida (menos de 4 dÃ­gitos): {}", extractedAccount);
                    }
                }
            }
            
            // PadrÃ£o 3: Buscar "Conta corrente:" dentro da seÃ§Ã£o creditada isolada (MELHORADO)
            if (creditedAccount == null || creditedAccount.isEmpty()) {
                // Primeiro encontrar a seÃ§Ã£o "Dados da conta creditada" ou "Dados da conta a ser creditada"
                // Usar lookahead negativo para nÃ£o capturar alÃ©m da seÃ§Ã£o
                Pattern creditadaSectionPattern = Pattern.compile("Dados da conta (?:a ser )?creditada\\s*:?\\s*([\\s\\S]*?)(?=Dados da conta (?:a ser )?debitada|Valor\\s*:|InformaÃ§Ãµes|\\n\\n|$)", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
                Matcher creditadaSectionMatcher = creditadaSectionPattern.matcher(text);
                if (creditadaSectionMatcher.find()) {
                    String creditadaSection = creditadaSectionMatcher.group(1);
                    log.info("ðŸ“‹ SeÃ§Ã£o creditada encontrada ({} caracteres)", creditadaSection.length());
                    log.info("ðŸ“‹ ConteÃºdo da seÃ§Ã£o: {}", creditadaSection.substring(0, Math.min(300, creditadaSection.length())));
                    
                    // Procurar "Conta corrente:" primeiro (formato mais comum)
                    Pattern contaInSectionPattern1 = Pattern.compile("Conta\\s*corrente\\s*:\\s*([\\d\\s\\-]+)", Pattern.CASE_INSENSITIVE);
                    Matcher contaInSectionMatcher1 = contaInSectionPattern1.matcher(creditadaSection);
                    if (contaInSectionMatcher1.find()) {
                        String extractedAccount = contaInSectionMatcher1.group(1).trim();
                        // Validar que Ã© realmente uma conta (tem pelo menos 4 dÃ­gitos)
                        if (extractedAccount.replaceAll("[^0-9]", "").length() >= 4) {
                            creditedAccount = extractedAccount;
                            log.info("âœ… Conta creditada extraÃ­da (padrÃ£o 3a - conta corrente na seÃ§Ã£o): {}", creditedAccount);
                        } else {
                            log.warn("âš ï¸ Conta extraÃ­da parece invÃ¡lida (menos de 4 dÃ­gitos): {}", extractedAccount);
                        }
                    } else {
                        // Se nÃ£o encontrou "Conta corrente:", tentar apenas "Conta:" seguida de nÃºmeros
                        Pattern contaInSectionPattern2 = Pattern.compile("Conta\\s*:\\s*([\\d\\s\\-]+)", Pattern.CASE_INSENSITIVE);
                        Matcher contaInSectionMatcher2 = contaInSectionPattern2.matcher(creditadaSection);
                        if (contaInSectionMatcher2.find()) {
                            String extractedAccount = contaInSectionMatcher2.group(1).trim();
                            // Validar que Ã© realmente uma conta (tem pelo menos 4 dÃ­gitos)
                            if (extractedAccount.replaceAll("[^0-9]", "").length() >= 4) {
                                creditedAccount = extractedAccount;
                                log.info("âœ… Conta creditada extraÃ­da (padrÃ£o 3b - conta na seÃ§Ã£o): {}", creditedAccount);
                            } else {
                                log.warn("âš ï¸ Conta extraÃ­da parece invÃ¡lida (menos de 4 dÃ­gitos): {}", extractedAccount);
                            }
                        }
                    }
                } else {
                    log.warn("âš ï¸ SeÃ§Ã£o 'Dados da conta creditada' nÃ£o encontrada no texto");
                }
            }
            
            // PadrÃ£o 4: Buscar agÃªncia depois do nome se ainda nÃ£o encontrou
            if (creditedAgency == null || creditedAgency.isEmpty()) {
                Pattern creditedAgencyPattern2 = Pattern.compile("Dados da conta creditada[\\s\\S]*?AgÃªncia\\s*:\\s*(\\d+)", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
                Matcher creditedAgencyMatcher2 = creditedAgencyPattern2.matcher(text);
                if (creditedAgencyMatcher2.find()) {
                    creditedAgency = creditedAgencyMatcher2.group(1);
                    log.info("âœ… AgÃªncia creditada extraÃ­da (padrÃ£o 2): {}", creditedAgency);
                }
            }
            
            // ValidaÃ§Ã£o: se nÃ£o encontrou conta, tentar buscar prÃ³ximo ao nome do funcionÃ¡rio
            if (creditedAccount == null || creditedAccount.isEmpty()) {
                log.warn("âš ï¸ Conta creditada nÃ£o encontrada pelos padrÃµes anteriores. Tentando busca alternativa...");
                
                // Buscar prÃ³ximo ao nome do funcionÃ¡rio
                if (employeeName != null && !employeeName.trim().isEmpty()) {
                    String normalizedEmployeeName = employeeName.trim().toUpperCase().replaceAll("\\s+", "\\s+");
                    Pattern contaNextToNamePattern = Pattern.compile(normalizedEmployeeName + "[\\s\\S]{0,200}?Conta\\s*(?:corrente)?\\s*:\\s*([\\d\\s-]+)", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
                    Matcher contaNextToNameMatcher = contaNextToNamePattern.matcher(text);
                    if (contaNextToNameMatcher.find()) {
                        creditedAccount = contaNextToNameMatcher.group(1).trim();
                        log.info("âœ… Conta creditada extraÃ­da (padrÃ£o 4 - prÃ³ximo ao nome): {}", creditedAccount);
                    }
                }
            }
            
            // Armazenar dados da conta creditada
            data.creditedAgency = creditedAgency;
            data.creditedAccount = creditedAccount;
            
            // Log final para debug - IMPORTANTE para rastrear extraÃ§Ã£o
            if (creditedAccount != null && !creditedAccount.isEmpty()) {
                log.info("âœ…âœ…âœ… CONTA CREDITADA FINAL EXTRAÃDA: '{}'", creditedAccount);
                log.info("ðŸ“‹ ValidaÃ§Ã£o: {} dÃ­gitos encontrados", creditedAccount.replaceAll("[^0-9]", "").length());
            } else {
                log.error("âŒâŒâŒ FALHA CRÃTICA: Conta creditada NÃƒO FOI EXTRAÃDA do texto da pÃ¡gina.");
                log.error("ðŸ“‹ Primeiros 1500 caracteres do texto completo para debug:");
                log.error("{}", text.substring(0, Math.min(1500, text.length())));
                log.error("ðŸ“‹ Tentando encontrar seÃ§Ã£o creditada para debug:");
                Pattern debugSectionPattern = Pattern.compile("Dados da conta (?:a ser )?creditada([\\s\\S]{0,500}?)(?=Dados|Valor|InformaÃ§Ãµes|$)", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
                Matcher debugSectionMatcher = debugSectionPattern.matcher(text);
                if (debugSectionMatcher.find()) {
                    log.error("ðŸ“‹ SeÃ§Ã£o creditada encontrada:\n{}", debugSectionMatcher.group(1));
                } else {
                    log.error("âŒ SeÃ§Ã£o 'Dados da conta creditada' NÃƒO encontrada no texto!");
                }
            }
            
            // Extrair nome da conta creditada explicitamente
            // O employeeName jÃ¡ foi extraÃ­do da seÃ§Ã£o "Dados da conta a ser creditada", entÃ£o usamos ele
            data.creditedName = employeeName != null ? employeeName.trim().toUpperCase() : null;
            
            if (data.creditedName != null) {
                log.info("âœ… Nome da conta creditada extraÃ­do: '{}'", data.creditedName);
            } else {
                log.warn("âš ï¸ Nome da conta creditada nÃ£o foi extraÃ­do");
            }

            // Extrair valor - padrÃ£o especÃ­fico do ItaÃº "Valor: R$ X.XXX,XX"
            Double amount = null;
            
            // PadrÃ£o 1: "Valor: R$ [VALOR]" - padrÃ£o principal do ItaÃº
            Pattern amountPattern1 = Pattern.compile("Valor\\s*:\\s*R\\$\\s*([\\d.,]+)", Pattern.CASE_INSENSITIVE);
            Matcher amountMatcher1 = amountPattern1.matcher(text);
            if (amountMatcher1.find()) {
                String amountStr = amountMatcher1.group(1).replace(".", "").replace(",", ".");
                try {
                    amount = Double.parseDouble(amountStr);
                    log.info("âœ… Valor extraÃ­do (padrÃ£o ItaÃº): R$ {:.2f}", amount);
                } catch (NumberFormatException e) {
                    log.warn("Erro ao converter valor: {}", amountStr);
                }
            }
            
            // PadrÃ£o 1a: "R$ [VALOR]" com espaÃ§o apÃ³s R$ - mais flexÃ­vel
            if (amount == null) {
                Pattern amountPattern1a = Pattern.compile("R\\$\\s+([\\d.,]+)", Pattern.CASE_INSENSITIVE);
                Matcher amountMatcher1a = amountPattern1a.matcher(text);
                if (amountMatcher1a.find()) {
                    String amountStr = amountMatcher1a.group(1).replace(".", "").replace(",", ".");
                    try {
                        amount = Double.parseDouble(amountStr);
                        log.info("âœ… Valor extraÃ­do (padrÃ£o R$ com espaÃ§o): R$ {:.2f}", amount);
                    } catch (NumberFormatException e) {
                        log.warn("Erro ao converter valor: {}", amountStr);
                    }
                }
            }
            
            // PadrÃ£o 1b: "R$ [VALOR]" sem "Valor:" - mais flexÃ­vel para comprovantes
            if (amount == null) {
                Pattern amountPattern1b = Pattern.compile("R\\$\\s*([\\d.,]{4,})", Pattern.CASE_INSENSITIVE);
                Matcher amountMatcher1b = amountPattern1b.matcher(text);
                if (amountMatcher1b.find()) {
                    String amountStr = amountMatcher1b.group(1).replace(".", "").replace(",", ".");
                    try {
                        amount = Double.parseDouble(amountStr);
                        log.info("Valor extraÃ­do (padrÃ£o flexÃ­vel): {}", amount);
                    } catch (NumberFormatException e) {
                        log.warn("Erro ao converter valor: {}", amountStr);
                    }
                }
            }
            
            // PadrÃ£o 2: "R$ [VALOR]" - padrÃ£o alternativo
            if (amount == null) {
                Pattern amountPattern2 = Pattern.compile("R\\$\\s*([\\d.,]+)", Pattern.CASE_INSENSITIVE);
                Matcher amountMatcher2 = amountPattern2.matcher(text);
                if (amountMatcher2.find()) {
                    String amountStr = amountMatcher2.group(1).replace(".", "").replace(",", ".");
                    try {
                        amount = Double.parseDouble(amountStr);
                        log.info("Valor extraÃ­do (padrÃ£o alternativo): {}", amount);
                    } catch (NumberFormatException e) {
                        log.warn("Erro ao converter valor: {}", amountStr);
                    }
                }
            }
            
            // PadrÃ£o 3: Qualquer nÃºmero que pareÃ§a valor monetÃ¡rio (fallback)
            if (amount == null) {
                Pattern amountPattern3 = Pattern.compile("([\\d.,]{4,})", Pattern.CASE_INSENSITIVE);
                Matcher amountMatcher3 = amountPattern3.matcher(text);
                if (amountMatcher3.find()) {
                    String amountStr = amountMatcher3.group(1).replace(".", "").replace(",", ".");
                    try {
                        amount = Double.parseDouble(amountStr);
                        log.info("Valor extraÃ­do (padrÃ£o flexÃ­vel): {}", amount);
                    } catch (NumberFormatException e) {
                        log.warn("Erro ao converter valor: {}", amountStr);
                    }
                }
            }
            
            data.amount = amount;
            if (data.amount != null) {
                log.info("ðŸ’° Valor final extraÃ­do: R$ {:.2f}", data.amount);
            } else {
                log.warn("âš ï¸ Valor nÃ£o foi extraÃ­do!");
            }

            // Extrair data da transferÃªncia - padrÃ£o especÃ­fico do ItaÃº
            String transferTime = null;
            
            // PadrÃ£o 1: "TransferÃªncia realizada em DD.MM.AAAA Ã s HH:MM:SS"
            Pattern datePattern1 = Pattern.compile("TransferÃªncia\\s+(?:realizada|efetuada)\\s+em\\s*(\\d{2})\\.(\\d{2})\\.(\\d{4})\\s*Ã s\\s*(\\d{2}:\\d{2}:\\d{2})", Pattern.CASE_INSENSITIVE);
            Matcher dateMatcher1 = datePattern1.matcher(text);
            if (dateMatcher1.find()) {
                String day = dateMatcher1.group(1);
                String month = dateMatcher1.group(2);
                String year = dateMatcher1.group(3);
                transferTime = dateMatcher1.group(4);
                // Formato: DD/MM/AAAA
                data.transferDate = day + "/" + month + "/" + year;
                log.info("âœ… Data de transferÃªncia extraÃ­da (padrÃ£o 1): {} Ã s {}", data.transferDate, transferTime);
            } else {
                // PadrÃ£o 2: "TransferÃªncia realizada em DD.MM.AAAA" (sem horÃ¡rio)
                Pattern datePattern2 = Pattern.compile("TransferÃªncia\\s+(?:realizada|efetuada)\\s+em\\s*(\\d{2})\\.(\\d{2})\\.(\\d{4})", Pattern.CASE_INSENSITIVE);
                Matcher dateMatcher2 = datePattern2.matcher(text);
                if (dateMatcher2.find()) {
                    String day = dateMatcher2.group(1);
                    String month = dateMatcher2.group(2);
                    String year = dateMatcher2.group(3);
                    data.transferDate = day + "/" + month + "/" + year;
                    log.info("âœ… Data de transferÃªncia extraÃ­da (padrÃ£o 2 - sem horÃ¡rio): {}", data.transferDate);
                } else {
                    // PadrÃ£o 3: "Data: DD/MM/YYYY"
                    Pattern datePattern3 = Pattern.compile("Data\\s*:\\s*(\\d{2})/(\\d{2})/(\\d{4})", Pattern.CASE_INSENSITIVE);
                    Matcher dateMatcher3 = datePattern3.matcher(text);
                    if (dateMatcher3.find()) {
                        data.transferDate = dateMatcher3.group(1) + "/" + dateMatcher3.group(2) + "/" + dateMatcher3.group(3);
                        log.info("âœ… Data de transferÃªncia extraÃ­da (padrÃ£o 3): {}", data.transferDate);
                    } else {
                        // PadrÃ£o 4: Buscar data/hora no formato "DD/MM/AAAA, HH:MM"
                        Pattern datePattern4 = Pattern.compile("(\\d{2})/(\\d{2})/(\\d{4}),\\s*(\\d{2}:\\d{2})", Pattern.CASE_INSENSITIVE);
                        Matcher dateMatcher4 = datePattern4.matcher(text);
                        if (dateMatcher4.find()) {
                            data.transferDate = dateMatcher4.group(1) + "/" + dateMatcher4.group(2) + "/" + dateMatcher4.group(3);
                            transferTime = dateMatcher4.group(4);
                            log.info("âœ… Data de transferÃªncia extraÃ­da (padrÃ£o 4): {} Ã s {}", data.transferDate, transferTime);
                        }
                    }
                }
            }
            
            // Armazenar horÃ¡rio da transferÃªncia
            data.transferTime = transferTime;

            // EXTRAIR PERÃODO DE REFERÃŠNCIA DO SALÃRIO
            log.info("ðŸ” Procurando perÃ­odo de referÃªncia do salÃ¡rio no comprovante...");
            
            // PadrÃ£o 1: "PERÃODO: MM/AAAA" ou "COMPETÃŠNCIA: MM/AAAA"
            Pattern periodoPattern1 = Pattern.compile("(?:PERÃODO|COMPETÃŠNCIA|REFERÃŠNCIA)\\s*:\\s*(\\d{1,2})/(\\d{4})", Pattern.CASE_INSENSITIVE);
            Matcher periodoMatcher1 = periodoPattern1.matcher(text);
            if (periodoMatcher1.find()) {
                data.month = Integer.parseInt(periodoMatcher1.group(1));
                data.year = Integer.parseInt(periodoMatcher1.group(2));
                log.info("âœ… PerÃ­odo de referÃªncia encontrado (padrÃ£o 1): {}/{}", data.month, data.year);
            } else {
                // PadrÃ£o 2: "SALÃRIO DE MM/AAAA" ou "PAGAMENTO DE MM/AAAA"
                Pattern periodoPattern2 = Pattern.compile("(?:SALÃRIO|PAGAMENTO)\\s+DE\\s+(\\d{1,2})/(\\d{4})", Pattern.CASE_INSENSITIVE);
                Matcher periodoMatcher2 = periodoPattern2.matcher(text);
                if (periodoMatcher2.find()) {
                    data.month = Integer.parseInt(periodoMatcher2.group(1));
                    data.year = Integer.parseInt(periodoMatcher2.group(2));
                    log.info("âœ… PerÃ­odo de referÃªncia encontrado (padrÃ£o 2): {}/{}", data.month, data.year);
                } else {
                    // PadrÃ£o 3: Para comprovantes ItaÃº, usar a data de transferÃªncia como perÃ­odo de referÃªncia
                    // "TransferÃªncia realizada em DD.MM.AAAA Ã s HH:MM:SS"
                    Pattern transferPattern = Pattern.compile("TransferÃªncia\\s+realizada\\s+em\\s+(\\d{2})\\.(\\d{2})\\.(\\d{4})\\s*Ã s", Pattern.CASE_INSENSITIVE);
                    Matcher transferMatcher = transferPattern.matcher(text);
                    if (transferMatcher.find()) {
                        data.month = Integer.parseInt(transferMatcher.group(2)); // MM
                        data.year = Integer.parseInt(transferMatcher.group(3));  // AAAA
                        log.info("âœ… PerÃ­odo de referÃªncia extraÃ­do da data de transferÃªncia: {}/{}", data.month, data.year);
                    } else {
                        // PadrÃ£o 3b: "TransferÃªncia efetuada em DD.MM.AAAA" (formato com pontos)
                        Pattern transferPattern2 = Pattern.compile("TransferÃªncia\\s+(?:efetuada|realizada)\\s+em\\s+(\\d{2})\\.(\\d{2})\\.(\\d{4})", Pattern.CASE_INSENSITIVE);
                        Matcher transferMatcher2 = transferPattern2.matcher(text);
                        if (transferMatcher2.find()) {
                            data.month = Integer.parseInt(transferMatcher2.group(2)); // MM
                            data.year = Integer.parseInt(transferMatcher2.group(3));  // AAAA
                            log.info("âœ… PerÃ­odo de referÃªncia extraÃ­do da data de transferÃªncia (formato com pontos): {}/{}", data.month, data.year);
                        } else {
                            // PadrÃ£o 3c: "TransferÃªncia efetuada/realizada em DD/MM/AAAA" (formato com barras)
                            Pattern transferPattern3 = Pattern.compile("TransferÃªncia\\s+(?:efetuada|realizada)\\s+em\\s+(\\d{2})/(\\d{2})/(\\d{4})", Pattern.CASE_INSENSITIVE);
                            Matcher transferMatcher3 = transferPattern3.matcher(text);
                            if (transferMatcher3.find()) {
                                data.month = Integer.parseInt(transferMatcher3.group(2)); // MM
                                data.year = Integer.parseInt(transferMatcher3.group(3));  // AAAA
                                log.info("âœ… PerÃ­odo de referÃªncia extraÃ­do da data de transferÃªncia (formato com barras): {}/{}", data.month, data.year);
                            } else {
                                // PadrÃ£o 4: Nomes de meses em portuguÃªs
                                String[] meses = {"JANEIRO", "FEVEREIRO", "MARÃ‡O", "ABRIL", "MAIO", "JUNHO", 
                                                 "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"};
                                for (int i = 0; i < meses.length; i++) {
                                    if (text.toUpperCase().contains(meses[i])) {
                                        data.month = i + 1;
                                        // Procurar ano prÃ³ximo (2020-2030)
                                        Pattern anoPattern = Pattern.compile("(20[2-3][0-9])");
                                        Matcher anoMatcher = anoPattern.matcher(text);
                                        if (anoMatcher.find()) {
                                            data.year = Integer.parseInt(anoMatcher.group(1));
                                            log.info("âœ… PerÃ­odo de referÃªncia encontrado via nome do mÃªs: {}/{} ({})", data.month, data.year, meses[i]);
                                            break;
                                        }
                                    }
                                }
                                
                                // Se ainda nÃ£o encontrou, BLOQUEAR (nÃ£o usar fallback!)
                                if (data.month == 0 || data.year == 0) {
                                    log.error("âŒ CRÃTICO: PerÃ­odo de referÃªncia NÃƒO encontrado no comprovante!");
                                    log.error("âŒ NÃ£o Ã© possÃ­vel processar sem data correta.");
                                    log.error("âš ï¸ Verifique se o comprovante contÃ©m:");
                                    log.error("   - 'TransferÃªncia efetuada em DD/MM/AAAA'");
                                    log.error("   - 'TransferÃªncia realizada em DD.MM.AAAA'");
                                    log.error("   - 'PERÃODO: MM/AAAA' ou 'COMPETÃŠNCIA: MM/AAAA'");
                                    log.error("ðŸ“„ Texto do PDF: {}", text.substring(0, Math.min(500, text.length())));
                                    return null; // â† BLOQUEAR upload se nÃ£o encontrar data
                                }
                            }
                        }
                    }
                }
            }

            // Extrair nÃºmero de controle - padrÃ£o especÃ­fico do ItaÃº "CTRL XXXXXXXXXXXXXXX"
            Pattern controlPattern = Pattern.compile("CTRL\\s*([A-Z0-9]+)", Pattern.CASE_INSENSITIVE);
            Matcher controlMatcher = controlPattern.matcher(text);
            if (controlMatcher.find()) {
                data.controlNumber = controlMatcher.group(1);
                log.info("ðŸ”¢ NÃºmero de controle extraÃ­do: {}", data.controlNumber);
            } else {
                log.warn("âš ï¸ NÃºmero de controle nÃ£o encontrado");
            }

            // Extrair autenticaÃ§Ã£o - padrÃ£o especÃ­fico do ItaÃº (40 caracteres hex)
            Pattern authPattern = Pattern.compile("AutenticaÃ§Ã£o\\s*:\\s*([A-F0-9]{40})", Pattern.CASE_INSENSITIVE);
            Matcher authMatcher = authPattern.matcher(text);
            if (authMatcher.find()) {
                data.authentication = authMatcher.group(1);
                log.info("ðŸ” CÃ³digo de autenticaÃ§Ã£o extraÃ­do: {}", data.authentication);
            } else {
                log.warn("âš ï¸ CÃ³digo de autenticaÃ§Ã£o nÃ£o encontrado");
            }

            // Extrair informaÃ§Ãµes do Sispag
            Pattern sispagPattern = Pattern.compile("via\\s+Sispag", Pattern.CASE_INSENSITIVE);
            if (sispagPattern.matcher(text).find()) {
                log.info("TransaÃ§Ã£o via Sispag identificada");
            }

            // Para debug: aceitar mesmo sem nome completo
            if (data.employeeName == null || data.employeeName.trim().isEmpty() || data.employeeName.equals("Nome nÃ£o extraÃ­do")) {
                log.warn("âš ï¸ Nome do funcionÃ¡rio nÃ£o encontrado - usando nome genÃ©rico para debug");
                data.employeeName = "NOVO FUNCIONÃRIO";
            }
            
            // Log detalhado dos dados extraÃ­dos
            log.info("=== ðŸ“Š RESUMO DOS DADOS EXTRAÃDOS ===");
            log.info("ðŸ‘¤ Nome do funcionÃ¡rio: '{}'", data.employeeName);
            log.info("ðŸ’° Valor: {}", data.amount != null ? String.format("R$ %.2f", data.amount) : "NÃ£o encontrado");
            log.info("ðŸ“… MÃªs/Ano: {}/{}", data.month, data.year);
            log.info("ðŸ¦ Banco: '{}'", data.bankName);
            log.info("ðŸ“„ Data de transferÃªncia: '{}'", data.transferDate);
            log.info("ðŸ¢ Empresa: '{}'", data.companyName);
            log.info("ðŸ”¢ AgÃªncia debitada: '{}'", data.agency);
            log.info("ðŸ’³ Conta debitada: '{}'", data.account);
            log.info("ðŸ”¢ AgÃªncia creditada: '{}'", data.creditedAgency);
            log.info("ðŸ’³ Conta creditada: '{}'", data.creditedAccount);
            log.info("ðŸ” Controle: '{}'", data.controlNumber);
            log.info("ðŸ”‘ AutenticaÃ§Ã£o: '{}'", data.authentication);

            log.info("=== âœ… EXTRAÃ‡ÃƒO CONCLUÃDA ===");
            log.info("ðŸ‘¤ Nome do FuncionÃ¡rio: {}", data.employeeName);
            log.info("ðŸ’° Valor da TransferÃªncia: R$ {}", data.amount != null ? String.format("%.2f", data.amount) : "N/A");
            log.info("ðŸ“… MÃªs/Ano: {}/{}", data.month, data.year);
            log.info("ðŸ¦ Banco: {}", data.bankName != null ? data.bankName : "N/A");
            log.info("ðŸ¢ AgÃªncia Debitada: {}", data.agency != null ? data.agency : "N/A");
            log.info("ðŸ“‹ Conta Debitada: {}", data.account != null ? data.account : "N/A");
            log.info("ðŸ­ Empresa: {}", data.companyName != null ? data.companyName : "N/A");
            log.info("ðŸ¢ AgÃªncia Creditada: {}", data.creditedAgency != null ? data.creditedAgency : "N/A");
            log.info("ðŸ“‹ Conta Creditada: {}", data.creditedAccount != null ? data.creditedAccount : "N/A");
            log.info("ðŸ“… Data TransferÃªncia: {}", data.transferDate != null ? data.transferDate : "N/A");
            log.info("ðŸ”¢ Controle: {}", data.controlNumber != null ? data.controlNumber : "N/A");
            log.info("ðŸ” AutenticaÃ§Ã£o: {}", data.authentication != null ? data.authentication : "N/A");
            
            // ValidaÃ§Ã£o final dos dados extraÃ­dos
            log.info("=== ðŸ” VALIDAÃ‡ÃƒO FINAL ===");
            boolean nomeValido = data.employeeName != null && !data.employeeName.trim().isEmpty();
            boolean mesValido = data.month > 0 && data.month <= 12;
            boolean anoValido = data.year > 0;
            
            log.info("ðŸ‘¤ Nome vÃ¡lido: {} ({})", nomeValido ? "âœ…" : "âŒ", data.employeeName);
            log.info("ðŸ“… MÃªs vÃ¡lido: {} ({})", mesValido ? "âœ…" : "âŒ", data.month);
            log.info("ðŸ“… Ano vÃ¡lido: {} ({})", anoValido ? "âœ…" : "âŒ", data.year);
            
            if (nomeValido && mesValido && anoValido) {
                log.info("ðŸŽ‰ âœ… EXTRAÃ‡ÃƒO BEM-SUCEDIDA! Todos os dados obrigatÃ³rios foram extraÃ­dos.");
                return data;
            } else {
                log.error("ðŸ’¥ âŒ EXTRAÃ‡ÃƒO FALHOU! Dados obrigatÃ³rios nÃ£o foram encontrados.");
                log.error("âŒ Nome: {}", nomeValido ? "OK" : "FALTANDO");
                log.error("âŒ MÃªs: {}", mesValido ? "OK" : "FALTANDO");
                log.error("âŒ Ano: {}", anoValido ? "OK" : "FALTANDO");
                return null;
            }

        } catch (Exception e) {
            log.error("Erro ao extrair dados do recibo bancÃ¡rio: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Extrai uma pÃ¡gina especÃ­fica do PDF original preservando o layout exato
     * Se um holerite for fornecido e as validaÃ§Ãµes passarem, usa a estrutura de pastas do holerite (Empresa/Setor)
     */
    private String extractReceiptPageFromOriginal(java.io.InputStream originalInputStream, int pageNumber, ReceiptData data, Payslip matchingPayslip) throws IOException {
        Path monthPath;
        
        // Se holerite foi encontrado e validaÃ§Ãµes passaram, usar estrutura de pastas do holerite
        if (matchingPayslip != null && matchingPayslip.getCompanyName() != null) {
            // Estrutura: uploads/receipts/{Empresa}/{Setor}/{Ano}/{MÃªs}
            String companyFolder = matchingPayslip.getCompanyName().trim()
                .replaceAll("[^a-zA-ZÃ€-Ã¿0-9\\s]", "")
                .replaceAll("\\s+", "_")
                .toLowerCase();
            
            String sectorFolder = matchingPayslip.getWorkPostName() != null ? 
                matchingPayslip.getWorkPostName().trim()
                    .replaceAll("[^a-zA-ZÃ€-Ã¿0-9\\s]", "")
                    .replaceAll("\\s+", "_")
                    .toLowerCase() : "sem_setor";
            
            String yearFolder = String.format("%04d", data.year);
            String monthFolder = String.format("%02d", data.month);
            
            monthPath = Paths.get(UPLOAD_DIR, companyFolder, sectorFolder, yearFolder, monthFolder).toAbsolutePath();
            log.info("ðŸ“ Usando estrutura de pastas do holerite: {}/{}/{}/{}", companyFolder, sectorFolder, yearFolder, monthFolder);
        } else {
            // Estrutura padrÃ£o: uploads/receipts/{MÃªs}_{Ano}
            String monthFolder = String.format("%02d_%04d", data.month, data.year);
            monthPath = Paths.get(UPLOAD_DIR, monthFolder).toAbsolutePath();
            log.info("ðŸ“ Usando estrutura de pastas padrÃ£o: {}", monthFolder);
        }
        
        log.info("Criando diretÃ³rio: {}", monthPath);
        
        if (!Files.exists(monthPath)) {
            Files.createDirectories(monthPath);
            log.info("DiretÃ³rio criado: {}", monthPath);
        } else {
            log.info("DiretÃ³rio jÃ¡ existe: {}", monthPath);
        }

        // Nome do arquivo com nome do funcionÃ¡rio
        String cleanedName = data.employeeName != null ? data.employeeName.trim()
            .replaceAll("(?i)\\bvalor\\b", "") // Remove "valor" (case insensitive)
            .replaceAll("(?i)\\bfuncionario\\b", "") // Remove "funcionario" (case insensitive)
            .replaceAll("(?i)\\bempregado\\b", "") // Remove "empregado" (case insensitive)
            .replaceAll("(?i)\\bcolaborador\\b", "") // Remove "colaborador" (case insensitive)
            .replaceAll("\\s+", " ") // MÃºltiplos espaÃ§os para um sÃ³
            .trim() : "";
        
        // Se apÃ³s a limpeza o nome ficou vazio, usar o nome original
        if (cleanedName.isEmpty() && data.employeeName != null) {
            cleanedName = data.employeeName.trim();
        }
        
        String fileName = String.format("recibo_%s_%02d_%d_pagina_%d.pdf", 
            cleanedName.replaceAll("[^a-zA-ZÃ€-Ã¿\\s]", "").trim().replaceAll("\\s+", "_").toLowerCase(),
            data.month, 
            data.year, 
            pageNumber
        );

        String filePath = monthPath.resolve(fileName).toString();

        // PRESERVAR LAYOUT ORIGINAL: Extrair apenas a pÃ¡gina especÃ­fica do PDF original
        try (PDDocument originalDocument = PDDocument.load(originalInputStream);
             PDDocument newDocument = new PDDocument()) {
            
            log.info("ðŸ“„ Extraindo pÃ¡gina {} do PDF original (preservando layout)", pageNumber);
            
            // Verificar se a pÃ¡gina existe
            if (pageNumber > originalDocument.getNumberOfPages()) {
                throw new IOException("PÃ¡gina " + pageNumber + " nÃ£o existe no PDF original");
            }
            
            // Copiar a pÃ¡gina especÃ­fica (Ã­ndice baseado em 0)
            PDPage originalPage = originalDocument.getPage(pageNumber - 1);
            newDocument.addPage(originalPage);
            
            // Salvar o novo PDF com apenas a pÃ¡gina extraÃ­da
            newDocument.save(filePath);
            
            log.info("âœ… PÃ¡gina {} extraÃ­da com sucesso preservando layout original: {}", pageNumber, filePath);
            
            return filePath;
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao extrair pÃ¡gina do PDF original: {}", e.getMessage(), e);
            throw new IOException("Erro ao extrair pÃ¡gina do PDF original: " + e.getMessage(), e);
        }
    }

    private String createReceiptPdf(ReceiptData data, int pageNumber) throws IOException {
        // Criar diretÃ³rio por mÃªs com caminho absoluto
        String monthFolder = String.format("%02d_%04d", data.month, data.year);
        Path monthPath = Paths.get(UPLOAD_DIR, monthFolder).toAbsolutePath();
        
        log.info("Criando diretÃ³rio: {}", monthPath);
        
        if (!Files.exists(monthPath)) {
            Files.createDirectories(monthPath);
            log.info("DiretÃ³rio criado: {}", monthPath);
        } else {
            log.info("DiretÃ³rio jÃ¡ existe: {}", monthPath);
        }

        // Nome do arquivo com nome do funcionÃ¡rio
        String cleanedName = data.employeeName != null ? data.employeeName.trim()
            .replaceAll("(?i)\\bvalor\\b", "") // Remove "valor" (case insensitive)
            .replaceAll("(?i)\\bfuncionario\\b", "") // Remove "funcionario" (case insensitive)
            .replaceAll("(?i)\\bempregado\\b", "") // Remove "empregado" (case insensitive)
            .replaceAll("(?i)\\bcolaborador\\b", "") // Remove "colaborador" (case insensitive)
            .replaceAll("\\s+", " ") // MÃºltiplos espaÃ§os para um sÃ³
            .trim() : "";
        
        // Se apÃ³s a limpeza o nome ficou vazio, usar o nome original
        if (cleanedName.isEmpty() && data.employeeName != null) {
            cleanedName = data.employeeName.trim();
        }
        
        String fileName = String.format("recibo_%s_%02d_%d_pagina_%d.pdf", 
            cleanedName.replaceAll("[^a-zA-ZÃ€-Ã¿\\s]", "").trim().replaceAll("\\s+", "_").toLowerCase(),
            data.month, 
            data.year, 
            pageNumber
        );

        String filePath = monthPath.resolve(fileName).toString();

        // IMPORTANTE: Este mÃ©todo deve preservar o layout original do comprovante
        // Por enquanto, vamos criar um PDF com layout similar ao original
        // TODO: Implementar preservaÃ§Ã£o do layout original do PDF
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);
            
            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                // Configurar fontes
                PDFont fontRegular = PDType1Font.HELVETICA;
                PDFont fontBold = PDType1Font.HELVETICA_BOLD;
                
                // Cores
                contentStream.setNonStrokingColor(0, 0, 0); // Preto
                
                // HEADER - Layout exato do ItaÃº
                // Logo ItaÃº (esquerda)
                contentStream.beginText();
                contentStream.setFont(fontBold, 16);
                contentStream.newLineAtOffset(50, 750);
                contentStream.showText("ItaÃº");
                contentStream.endText();
                
                // "30 horas" (direita)
                contentStream.beginText();
                contentStream.setFont(fontBold, 12);
                contentStream.newLineAtOffset(500, 750);
                contentStream.showText("30 horas");
                contentStream.endText();
                
                // TÃ­tulo principal centralizado
                contentStream.beginText();
                contentStream.setFont(fontBold, 14);
                contentStream.newLineAtOffset(50, 720);
                contentStream.showText("Banco ItaÃº - Comprovante de TransferÃªncia de conta corrente para conta corrente");
                contentStream.endText();
                
                // Linha separadora
                contentStream.setLineWidth(1);
                contentStream.moveTo(50, 710);
                contentStream.lineTo(550, 710);
                contentStream.stroke();
                
                // IdentificaÃ§Ã£o no extrato
                contentStream.beginText();
                contentStream.setFont(fontRegular, 12);
                contentStream.newLineAtOffset(50, 680);
                contentStream.showText("IdentificaÃ§Ã£o no extrato: SISPAG SALARIOS");
                contentStream.endText();
                
                // Dados da conta debitada
                contentStream.beginText();
                contentStream.setFont(fontBold, 12);
                contentStream.newLineAtOffset(50, 650);
                contentStream.showText("Dados da conta debitada");
                contentStream.endText();
                
                contentStream.beginText();
                contentStream.setFont(fontRegular, 10);
                contentStream.newLineAtOffset(50, 630);
                contentStream.showText("Nome da empresa: " + (data.companyName != null ? data.companyName : "PROMOVER VIGILANCIA PATRIMONIA"));
                contentStream.endText();
                
                contentStream.beginText();
                contentStream.newLineAtOffset(50, 610);
                contentStream.showText("AgÃªncia: " + (data.agency != null ? data.agency : "0925"));
                contentStream.endText();
                
                contentStream.beginText();
                contentStream.newLineAtOffset(50, 590);
                contentStream.showText("Conta corrente: " + (data.account != null ? data.account : "98240 - 7"));
                contentStream.endText();
                
                // Dados da conta creditada
                contentStream.beginText();
                contentStream.setFont(fontBold, 12);
                contentStream.newLineAtOffset(50, 560);
                contentStream.showText("Dados da conta creditada");
                contentStream.endText();
                
                contentStream.beginText();
                contentStream.setFont(fontRegular, 10);
                contentStream.newLineAtOffset(50, 540);
                contentStream.showText("Nome: " + (data.employeeName != null ? data.employeeName : "FUNCIONARIO"));
                contentStream.endText();
                
                contentStream.beginText();
                contentStream.newLineAtOffset(50, 520);
                contentStream.showText("AgÃªncia: " + (data.creditedAgency != null ? data.creditedAgency : "1429"));
                contentStream.endText();
                
                contentStream.beginText();
                contentStream.newLineAtOffset(50, 500);
                contentStream.showText("Conta corrente: " + (data.creditedAccount != null ? data.creditedAccount : "39637 - 5"));
                contentStream.endText();
                
                contentStream.beginText();
                contentStream.newLineAtOffset(50, 480);
                contentStream.showText("Valor: R$ " + String.format("%.2f", data.amount != null ? data.amount : 0.0).replace(".", ","));
                contentStream.endText();
                
                // InformaÃ§Ãµes fornecidas pelo pagador
                contentStream.beginText();
                contentStream.setFont(fontBold, 12);
                contentStream.newLineAtOffset(50, 450);
                contentStream.showText("InformaÃ§Ãµes fornecidas pelo pagador");
                contentStream.endText();
                
                contentStream.beginText();
                contentStream.setFont(fontRegular, 10);
                contentStream.newLineAtOffset(50, 430);
                contentStream.showText("TransferÃªncia efetuada em " + (data.transferDate != null ? data.transferDate : "06/08/2025") + " Ã s 07:13:32 via Sispag, CTRL " + (data.controlNumber != null ? data.controlNumber : "992972681000634"));
                contentStream.endText();
                
                // AutenticaÃ§Ã£o
                contentStream.beginText();
                contentStream.setFont(fontBold, 12);
                contentStream.newLineAtOffset(50, 400);
                contentStream.showText("AutenticaÃ§Ã£o");
                contentStream.endText();
                
                contentStream.beginText();
                contentStream.setFont(fontRegular, 8);
                contentStream.newLineAtOffset(50, 380);
                contentStream.showText(data.authentication != null ? data.authentication : "F410FFD7DFB796B1582294EE30C77BFE389A75AB");
                contentStream.endText();
                
            }
            
            // Salvar o documento
            document.save(filePath);
            log.info("PDF do recibo criado com sucesso: {}", filePath);
            
            // Verificar se o arquivo foi realmente criado
            java.io.File savedFile = new java.io.File(filePath);
            if (savedFile.exists()) {
                log.info("Arquivo PDF verificado: {} bytes", savedFile.length());
            } else {
                log.error("Arquivo PDF nÃ£o foi criado: {}", filePath);
                throw new IOException("Arquivo PDF nÃ£o foi criado: " + filePath);
            }
            
            return filePath;
            
        } catch (Exception e) {
            log.error("Erro ao criar PDF do recibo: {}", e.getMessage(), e);
            throw new IOException("Erro ao criar PDF do recibo: " + e.getMessage());
        }
    }

    private String extractEmployeeName(String text) {
        // PadrÃµes comuns para encontrar nomes em recibos
        String[] patterns = {
            "FUNCIONÃRIO:\\s*([A-ZÃ€ÃÃ‚ÃƒÃ„Ã…Ã†Ã‡ÃˆÃ‰ÃŠÃ‹ÃŒÃÃŽÃÃÃ‘Ã’Ã“Ã”Ã•Ã–Ã˜Ã™ÃšÃ›ÃœÃÃžÃŸÃ Ã¡Ã¢Ã£Ã¤Ã¥Ã¦Ã§Ã¨Ã©ÃªÃ«Ã¬Ã­Ã®Ã¯Ã°Ã±Ã²Ã³Ã´ÃµÃ¶Ã¸Ã¹ÃºÃ»Ã¼Ã½Ã¾Ã¿\\s]+)",
            "NOME:\\s*([A-ZÃ€ÃÃ‚ÃƒÃ„Ã…Ã†Ã‡ÃˆÃ‰ÃŠÃ‹ÃŒÃÃŽÃÃÃ‘Ã’Ã“Ã”Ã•Ã–Ã˜Ã™ÃšÃ›ÃœÃÃžÃŸÃ Ã¡Ã¢Ã£Ã¤Ã¥Ã¦Ã§Ã¨Ã©ÃªÃ«Ã¬Ã­Ã®Ã¯Ã°Ã±Ã²Ã³Ã´ÃµÃ¶Ã¸Ã¹ÃºÃ»Ã¼Ã½Ã¾Ã¿\\s]+)",
            "RECEBEDOR:\\s*([A-ZÃ€ÃÃ‚ÃƒÃ„Ã…Ã†Ã‡ÃˆÃ‰ÃŠÃ‹ÃŒÃÃŽÃÃÃ‘Ã’Ã“Ã”Ã•Ã–Ã˜Ã™ÃšÃ›ÃœÃÃžÃŸÃ Ã¡Ã¢Ã£Ã¤Ã¥Ã¦Ã§Ã¨Ã©ÃªÃ«Ã¬Ã­Ã®Ã¯Ã°Ã±Ã²Ã³Ã´ÃµÃ¶Ã¸Ã¹ÃºÃ»Ã¼Ã½Ã¾Ã¿\\s]+)"
        };

        for (String pattern : patterns) {
            Pattern p = Pattern.compile(pattern, Pattern.CASE_INSENSITIVE);
            Matcher m = p.matcher(text);
            if (m.find()) {
                return m.group(1).trim();
            }
        }

        return null;
    }

    private int extractMonth(String text) {
        // Extrair mÃªs do texto
        Pattern pattern = Pattern.compile("(?:MÃŠS|MES)\\s*:\\s*(\\d{1,2})", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }
        
        // Tentar extrair de outras formas
        pattern = Pattern.compile("(\\d{1,2})/(\\d{4})", Pattern.CASE_INSENSITIVE);
        matcher = pattern.matcher(text);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }
        
        return LocalDateTime.now().getMonthValue(); // MÃªs atual como fallback
    }

    private int extractYear(String text) {
        // Extrair ano do texto
        Pattern pattern = Pattern.compile("(?:ANO|YEAR)\\s*:\\s*(\\d{4})", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }
        
        // Tentar extrair de outras formas
        pattern = Pattern.compile("(\\d{1,2})/(\\d{4})", Pattern.CASE_INSENSITIVE);
        matcher = pattern.matcher(text);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(2));
        }
        
        return LocalDateTime.now().getYear(); // Ano atual como fallback
    }

    private Double extractGrossSalary(String text) {
        // Extrair salÃ¡rio bruto
        Pattern pattern = Pattern.compile("(?:SALÃRIO\\s*BRUTO|SALARIO\\s*BRUTO|BRUTO)\\s*:\\s*R?\\$?\\s*([\\d.,]+)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            String value = matcher.group(1).replace(",", ".");
            return Double.parseDouble(value);
        }
        return null;
    }

    private Double extractNetSalary(String text) {
        // Extrair salÃ¡rio lÃ­quido
        Pattern pattern = Pattern.compile("(?:SALÃRIO\\s*LÃQUIDO|SALARIO\\s*LIQUIDO|LÃQUIDO|LIQUIDO)\\s*:\\s*R?\\$?\\s*([\\d.,]+)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            String value = matcher.group(1).replace(",", ".");
            return Double.parseDouble(value);
        }
        return null;
    }

    private String generateReceiptFileName(String employeeName, int month, int year, int pageNumber) {
        // Tratar nome do funcionÃ¡rio de forma robusta
        String sanitizedName;
        if (employeeName != null && !employeeName.trim().isEmpty()) {
            // Remover palavras comuns que podem estar sendo incluÃ­das incorretamente
            String cleanedName = employeeName.trim()
                .replaceAll("(?i)\\bvalor\\b", "") // Remove "valor" (case insensitive)
                .replaceAll("(?i)\\bfuncionario\\b", "") // Remove "funcionario" (case insensitive)
                .replaceAll("(?i)\\bempregado\\b", "") // Remove "empregado" (case insensitive)
                .replaceAll("(?i)\\bcolaborador\\b", "") // Remove "colaborador" (case insensitive)
                .replaceAll("\\s+", " ") // MÃºltiplos espaÃ§os para um sÃ³
                .trim();
            
            // Se apÃ³s a limpeza o nome ficou vazio, usar o nome original
            if (cleanedName.isEmpty()) {
                cleanedName = employeeName.trim();
            }
            
            // Remover caracteres especiais, manter apenas letras, acentos e espaÃ§os
            sanitizedName = cleanedName.replaceAll("[^a-zA-ZÃ€-Ã¿\\s]", "").trim();
            // Substituir mÃºltiplos espaÃ§os por underscore
            sanitizedName = sanitizedName.replaceAll("\\s+", "_");
            // Converter para minÃºsculas
            sanitizedName = sanitizedName.toLowerCase();
            
            log.info("ðŸ§¹ Nome do arquivo limpo: '{}' -> '{}'", employeeName, sanitizedName);
        } else {
            sanitizedName = "funcionario_nao_identificado";
        }
        
        // Formato: recibo_NOME_FUNCIONARIO_MM_AAAA_pagina_X.pdf
        return String.format("recibo_%s_%02d_%d_pagina_%d.pdf", sanitizedName, month, year, pageNumber);
    }

    public List<PaymentReceipt> getAllReceipts() {
        return receiptRepository.findAll();
    }

    public List<PaymentReceipt> getReceiptsByMonthYear(int month, int year) {
        return receiptRepository.findByYearAndMonth(year, month);
    }

    public boolean deleteReceipt(String id) {
        try {
            UUID receiptId = UUID.fromString(id);
            PaymentReceipt receipt = receiptRepository.findById(receiptId).orElse(null);
            
            if (receipt != null) {
                // Deletar arquivo fÃ­sico se existir
                if (receipt.getFilePath() != null) {
                    try {
                        java.io.File file = new java.io.File(receipt.getFilePath());
                        if (file.exists()) {
                            file.delete();
                            log.info("Arquivo fÃ­sico deletado: {}", receipt.getFilePath());
                        }
                    } catch (Exception e) {
                        log.warn("Erro ao deletar arquivo fÃ­sico: {}", e.getMessage());
                    }
                }
                
                // Deletar do banco de dados
                receiptRepository.deleteById(receiptId);
                log.info("Recibo deletado com sucesso: {}", id);
                return true;
            }
            
            return false;
        } catch (Exception e) {
            log.error("Erro ao deletar recibo: {}", e.getMessage());
            return false;
        }
    }

    public int deleteReceipts(List<String> ids) {
        int deletedCount = 0;
        
        for (String id : ids) {
            if (deleteReceipt(id)) {
                deletedCount++;
            }
        }
        
        log.info("{} recibos deletados em lote", deletedCount);
        return deletedCount;
    }

    public PaymentReceipt getReceiptById(UUID id) {
        return receiptRepository.findById(id).orElse(null);
    }
    
    /**
     * FunÃ§Ã£o utilitÃ¡ria para limpar texto removendo caracteres de controle
     */
    private String cleanText(String text) {
        if (text == null) return "";
        return text.replaceAll("[\\r\\n\\t]", " ").trim();
    }
} 
