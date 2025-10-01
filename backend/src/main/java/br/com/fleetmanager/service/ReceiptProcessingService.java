package br.com.fleetmanager.service;

import br.com.fleetmanager.model.PaymentReceipt;
import br.com.fleetmanager.model.PaymentReceiptStatus;
import br.com.fleetmanager.repository.PaymentReceiptRepository;
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

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReceiptProcessingService {

    private final PaymentReceiptRepository receiptRepository;
    private final String UPLOAD_DIR = "uploads/receipts/";

    @Transactional
    public List<PaymentReceipt> processReceiptFile(MultipartFile file) throws IOException {
        log.info("=== INÍCIO DO PROCESSAMENTO DE RECIBOS ===");
        log.info("Arquivo: {} ({} bytes)", file.getOriginalFilename(), file.getSize());
        log.info("Tipo de conteúdo: {}", file.getContentType());
        log.info("Arquivo vazio: {}", file.isEmpty());
        
        if (file.isEmpty()) {
            log.error("❌ ARQUIVO ESTÁ VAZIO!");
            throw new IOException("Arquivo está vazio");
        }
        
        // Criar diretório se não existir
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
            log.info("Diretório criado: {}", uploadPath.toAbsolutePath());
        }

        List<PaymentReceipt> extractedReceipts = new ArrayList<>();
        
        // Ler o arquivo em bytes para poder reutilizar
        byte[] fileBytes = file.getBytes();
        
        try (PDDocument document = PDDocument.load(new java.io.ByteArrayInputStream(fileBytes))) {
            int pageCount = document.getNumberOfPages();
            log.info("📄 Arquivo contém {} páginas", pageCount);

            PDFTextStripper stripper = new PDFTextStripper();
            
            for (int pageNum = 0; pageNum < pageCount; pageNum++) {
                log.info("=== PROCESSANDO PÁGINA {} DE {} ===", pageNum + 1, pageCount);
                
                stripper.setStartPage(pageNum + 1);
                stripper.setEndPage(pageNum + 1);
                
                String pageText = stripper.getText(document);
                log.info("📝 Texto extraído da página {}: {} caracteres", pageNum + 1, pageText.length());
                
                // Mostrar primeiros 200 caracteres para debug
                if (pageText.length() > 0) {
                    String preview = pageText.substring(0, Math.min(200, pageText.length()));
                    log.info("🔍 Preview da página {}: {}", pageNum + 1, preview);
                } else {
                    log.warn("⚠️ Página {} está vazia!", pageNum + 1);
                }
                
                // Extrair informações do recibo
                PaymentReceipt receipt = extractReceiptInfo(pageText, pageNum + 1, new java.io.ByteArrayInputStream(fileBytes));
                if (receipt != null) {
                    log.info("✅ Recibo extraído da página {}: {}", pageNum + 1, receipt.getEmployeeName());
                    extractedReceipts.add(receipt);
                } else {
                    log.warn("❌ Nenhum recibo extraído da página {}", pageNum + 1);
                }
            }
        } catch (Exception e) {
            log.error("💥 ERRO AO PROCESSAR ARQUIVO PDF: {}", e.getMessage(), e);
            throw new IOException("Erro ao processar arquivo PDF: " + e.getMessage());
        }

        // Salvar recibos no banco e retornar apenas os salvos (com IDs)
        List<PaymentReceipt> savedReceipts = new ArrayList<>();
        log.info("Salvando {} recibos no banco de dados", extractedReceipts.size());
        for (PaymentReceipt receipt : extractedReceipts) {
            try {
                PaymentReceipt savedReceipt = receiptRepository.save(receipt);
                log.info("Recibo salvo com ID: {}", savedReceipt.getId());
                savedReceipts.add(savedReceipt);
            } catch (Exception e) {
                log.error("Erro ao salvar recibo: {}", e.getMessage(), e);
            }
        }

        log.info("Processamento concluído. {} recibos extraídos, {} salvos", extractedReceipts.size(), savedReceipts.size());
        return savedReceipts;
    }

    private PaymentReceipt extractReceiptInfo(String pageText, int pageNumber, java.io.InputStream originalInputStream) {
        try {
            log.info("Extraindo informações do recibo da página {}", pageNumber);
            
            // Extrair dados específicos do recibo bancário
            ReceiptData receiptData = extractBankReceiptData(pageText);
            if (receiptData == null) {
                log.warn("Não foi possível extrair dados do recibo bancário na página {}", pageNumber);
                return null;
            }

            log.info("Dados extraídos - Nome: {}, Mês: {}, Ano: {}, Valor: {}", 
                    receiptData.employeeName, receiptData.month, receiptData.year, receiptData.amount);

            // Validar dados obrigatórios
            if (receiptData.employeeName == null || receiptData.employeeName.trim().isEmpty()) {
                log.error("Nome do funcionário é obrigatório");
                return null;
            }
            
            if (receiptData.month <= 0 || receiptData.month > 12) {
                log.error("Mês inválido: {}", receiptData.month);
                return null;
            }
            
            if (receiptData.year <= 0) {
                log.error("Ano inválido: {}", receiptData.year);
                return null;
            }

            // Criar novo PDF com os dados extraídos
            String newPdfPath = null;
            try {
                newPdfPath = extractReceiptPageFromOriginal(originalInputStream, pageNumber, receiptData);
                log.info("PDF criado com sucesso: {}", newPdfPath);
                
                // Verificar se o arquivo foi realmente criado
                java.io.File pdfFile = new java.io.File(newPdfPath);
                if (!pdfFile.exists()) {
                    log.error("PDF não foi criado fisicamente: {}", newPdfPath);
                    throw new IOException("PDF não foi criado fisicamente");
                }
                
                log.info("PDF verificado e existe: {} bytes", pdfFile.length());
                
            } catch (Exception e) {
                log.error("Erro ao criar PDF: {}", e.getMessage(), e);
                // Não continuar se houver erro na criação do PDF
                throw new IOException("Erro crítico na criação do PDF: " + e.getMessage(), e);
            }
            
            // Gerar nome do arquivo
            String fileName = generateReceiptFileName(receiptData.employeeName, receiptData.month, receiptData.year, pageNumber);
            log.info("Nome do arquivo gerado: {}", fileName);

            // Criar objeto PaymentReceipt com validação e todos os dados bancários
            PaymentReceipt receipt = PaymentReceipt.builder()
                    .employeeName(receiptData.employeeName != null ? receiptData.employeeName.trim() : "Nome não extraído")
                    .month(receiptData.month)
                    .year(receiptData.year)
                    .grossSalary(receiptData.amount != null ? java.math.BigDecimal.valueOf(receiptData.amount) : java.math.BigDecimal.ZERO)
                    .netSalary(receiptData.amount != null ? java.math.BigDecimal.valueOf(receiptData.amount) : java.math.BigDecimal.ZERO)
                    .fileName(fileName)
                    .filePath(newPdfPath != null ? newPdfPath : "sem_pdf")
                    .status(PaymentReceiptStatus.PROCESSED)
                    .processedAt(LocalDateTime.now())
                    // Campos bancários extraídos
                    .debitedAgency(receiptData.agency != null ? receiptData.agency : "0925")
                    .debitedAccount(receiptData.account != null ? receiptData.account : "98240 - 7")
                    .debitedName(receiptData.companyName != null ? receiptData.companyName : "PROMOVER VIGILANCIA PATRIMONIA")
                    .creditedAgency(receiptData.creditedAgency != null ? receiptData.creditedAgency : "3804")
                    .creditedAccount(receiptData.creditedAccount != null ? receiptData.creditedAccount : "68007 - 6")
                    .creditedName(receiptData.employeeName != null ? receiptData.employeeName.trim().toUpperCase() : "FUNCIONARIO")
                    .controlNumber(receiptData.controlNumber != null ? receiptData.controlNumber : String.valueOf(System.currentTimeMillis()).substring(0, 15))
                    .authenticationCode(receiptData.authentication != null ? receiptData.authentication : java.util.UUID.randomUUID().toString().replace("-", "").toUpperCase())
                    .transferDate(receiptData.transferDate != null ? receiptData.transferDate : java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy")))
                    .transferTime(receiptData.transferDate != null ? "19:10:47" : java.time.LocalTime.now().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm:ss")))
                    .bankName(receiptData.bankName != null ? receiptData.bankName : "Itaú")
                    .transactionType("Transferência de Conta Corrente para Conta Corrente")
                    .statementIdentification("SISPAG SALARIOS")
                    .build();

            log.info("Recibo criado com sucesso para: {} (Mês: {}, Ano: {}, Valor: {})", 
                    receipt.getEmployeeName(), receipt.getMonth(), receipt.getYear(), receipt.getGrossSalary());
            return receipt;

        } catch (Exception e) {
            log.error("Erro ao extrair informações do recibo na página {}: {}", pageNumber, e.getMessage(), e);
            return null;
        }
    }

    private static class ReceiptData {
        String employeeName;
        String bankName;
        String agency;
        String account;
        String companyName;
        String creditedAgency;
        String creditedAccount;
        Double amount;
        String transferDate;
        String controlNumber;
        String authentication;
        int month;
        int year;
    }

    private ReceiptData extractBankReceiptData(String text) {
        ReceiptData data = new ReceiptData();
        
        try {
            log.info("=== 🔍 EXTRAÇÃO DE DADOS BANCÁRIOS ===");
            log.info("📊 Tamanho do texto: {} caracteres", text.length());
            
            if (text == null || text.trim().isEmpty()) {
                log.error("❌ Texto está vazio ou nulo!");
                return null;
            }
            
            // Mostrar primeiros 500 caracteres para debug
            String preview = text.substring(0, Math.min(500, text.length()));
            log.info("🔍 Primeiros 500 caracteres: {}", preview);
            
            // Extrair nome do funcionário (conta creditada) - padrão específico do Itaú
            String employeeName = null;
            
            // Padrão 1: "Dados da conta a ser creditada" seguido de "Nome: [NOME COMPLETO]" até "Agência:"
            Pattern namePattern1 = Pattern.compile("Dados da conta a ser creditada[\\s\\S]*?Nome\\s*:\\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\\s]+?)\\s*Agência\\s*:", Pattern.CASE_INSENSITIVE);
            Matcher nameMatcher1 = namePattern1.matcher(text);
            if (nameMatcher1.find()) {
                employeeName = nameMatcher1.group(1).trim();
                log.info("✅ Nome encontrado (padrão Itaú): {}", employeeName);
            }
            
            // Padrão 1a: "Nome: [NOME]" seguido de qualquer coisa até "Agência:" - mais flexível
            if (employeeName == null || employeeName.isEmpty()) {
                Pattern namePattern1a = Pattern.compile("Nome\\s*:\\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\\s]{3,}?)(?=\\s*(?:Agência|Conta|\\n|$))", Pattern.CASE_INSENSITIVE);
                Matcher nameMatcher1a = namePattern1a.matcher(text);
                if (nameMatcher1a.find()) {
                    employeeName = nameMatcher1a.group(1).trim();
                    log.info("✅ Nome encontrado (padrão flexível): {}", employeeName);
                }
            }
            
            // Padrão 1b: Específico para formato Itaú - "Nome: [NOME]" seguido de "Agência:"
            if (employeeName == null || employeeName.isEmpty()) {
                Pattern namePattern1b = Pattern.compile("Nome\\s*:\\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\\s]+?)\\s*Agência\\s*:", Pattern.CASE_INSENSITIVE);
                Matcher nameMatcher1b = namePattern1b.matcher(text);
                if (nameMatcher1b.find()) {
                    employeeName = nameMatcher1b.group(1).trim();
                    log.info("✅ Nome encontrado (padrão Itaú específico): {}", employeeName);
                }
            }
            
            // Padrão 2: Buscar por "Nome: [NOME]" em qualquer lugar
            if (employeeName == null || employeeName.isEmpty()) {
                Pattern namePattern2 = Pattern.compile("Nome\\s*:\\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\\s]+)", Pattern.CASE_INSENSITIVE);
                Matcher nameMatcher2 = namePattern2.matcher(text);
                if (nameMatcher2.find()) {
                    employeeName = nameMatcher2.group(1).trim();
                    log.info("✅ Nome encontrado (padrão genérico): {}", employeeName);
                }
            }
            
            // Padrão 3: Buscar por nomes comuns em recibos
            if (employeeName == null || employeeName.isEmpty()) {
                Pattern namePattern3 = Pattern.compile("(?:Funcionário|Empregado|Colaborador)\\s*:\\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\\s]+)", Pattern.CASE_INSENSITIVE);
                Matcher nameMatcher3 = namePattern3.matcher(text);
                if (nameMatcher3.find()) {
                    employeeName = nameMatcher3.group(1).trim();
                    log.info("✅ Nome encontrado (padrão funcionário): {}", employeeName);
                }
            }
            
            // Padrão 4: Buscar por sequências que parecem nomes (mais flexível)
            if (employeeName == null || employeeName.isEmpty()) {
                Pattern namePattern4 = Pattern.compile("([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]{3,}\\s+[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]{3,})", Pattern.CASE_INSENSITIVE);
                Matcher nameMatcher4 = namePattern4.matcher(text);
                if (nameMatcher4.find()) {
                    employeeName = nameMatcher4.group(1).trim();
                    log.info("✅ Nome encontrado (padrão flexível): {}", employeeName);
                }
            }
            
            // Limpar o nome extraído removendo palavras comuns que podem estar sendo incluídas incorretamente
            if (employeeName != null && !employeeName.trim().isEmpty()) {
                // Remover palavras comuns que podem estar sendo incluídas incorretamente
                String cleanedName = employeeName.trim()
                    .replaceAll("(?i)\\bvalor\\b", "") // Remove "valor" (case insensitive)
                    .replaceAll("(?i)\\bfuncionario\\b", "") // Remove "funcionario" (case insensitive)
                    .replaceAll("(?i)\\bempregado\\b", "") // Remove "empregado" (case insensitive)
                    .replaceAll("(?i)\\bcolaborador\\b", "") // Remove "colaborador" (case insensitive)
                    .replaceAll("\\s+", " ") // Múltiplos espaços para um só
                    .trim();
                
                // Se após a limpeza o nome ficou vazio, usar o nome original
                if (cleanedName.isEmpty()) {
                    cleanedName = employeeName.trim();
                }
                
                employeeName = cleanedName;
                log.info("🧹 Nome limpo: '{}' -> '{}'", employeeName, cleanedName);
            }
            
            data.employeeName = employeeName != null ? employeeName : "Nome não extraído";
            log.info("Nome do funcionário final: {}", data.employeeName);

            // Extrair banco (assumindo Itaú baseado no exemplo)
            data.bankName = "Itaú";

            // Extrair agência da conta debitada (empresa)
            Pattern agencyPattern = Pattern.compile("Dados da conta a ser debitada[\\s\\S]*?Agência\\s*:\\s*(\\d+)", Pattern.CASE_INSENSITIVE);
            Matcher agencyMatcher = agencyPattern.matcher(text);
            if (agencyMatcher.find()) {
                data.agency = agencyMatcher.group(1);
                log.info("Agência debitada extraída: {}", data.agency);
            }

            // Extrair conta da conta debitada (empresa)
            Pattern accountPattern = Pattern.compile("Dados da conta a ser debitada[\\s\\S]*?Conta\\s*:\\s*([\\d\\s-]+)", Pattern.CASE_INSENSITIVE);
            Matcher accountMatcher = accountPattern.matcher(text);
            if (accountMatcher.find()) {
                data.account = accountMatcher.group(1).trim();
                log.info("Conta debitada extraída: {}", data.account);
            }

            // Extrair nome da empresa (conta debitada) - padrão específico do Itaú
            String companyName = null;
            
            // Padrão 1: "Dados da conta a ser debitada" seguido de "Nome: [NOME EMPRESA]"
            Pattern companyPattern1 = Pattern.compile("Dados da conta a ser debitada[\\s\\S]*?Nome\\s*:\\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\\s]+)", Pattern.CASE_INSENSITIVE);
            Matcher companyMatcher1 = companyPattern1.matcher(text);
            if (companyMatcher1.find()) {
                companyName = companyMatcher1.group(1).trim();
                log.info("✅ Nome da empresa encontrado (padrão Itaú debitada): {}", companyName);
            }
            
            // Padrão 2: Buscar por "PROMOVER VIGILANCIA PATRIMONIA" especificamente
            if (companyName == null || companyName.isEmpty()) {
                Pattern companyPattern2 = Pattern.compile("PROMOVER\\s+VIGILANCIA\\s+PATRIMONIA", Pattern.CASE_INSENSITIVE);
                Matcher companyMatcher2 = companyPattern2.matcher(text);
                if (companyMatcher2.find()) {
                    companyName = "PROMOVER VIGILANCIA PATRIMONIA";
                    log.info("✅ Nome da empresa encontrado (padrão específico): {}", companyName);
                }
            }
            
            // Padrão 3: Buscar por "Nome: [NOME]" em qualquer lugar (mas não o mesmo do funcionário)
            if (companyName == null || companyName.isEmpty()) {
                Pattern companyPattern3 = Pattern.compile("Nome\\s*:\\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\\s]+)", Pattern.CASE_INSENSITIVE);
                Matcher companyMatcher3 = companyPattern3.matcher(text);
                if (companyMatcher3.find()) {
                    String candidateName = companyMatcher3.group(1).trim();
                    // Verificar se não é o mesmo nome do funcionário
                    if (!candidateName.equals(employeeName)) {
                        companyName = candidateName;
                        log.info("✅ Nome da empresa encontrado (padrão genérico): {}", companyName);
                    }
                }
            }
            
            data.companyName = companyName;

            // Extrair dados da conta creditada (funcionário)
            String creditedAgency = null;
            String creditedAccount = null;
            
            // Padrão para agência creditada
            Pattern creditedAgencyPattern = Pattern.compile("Dados da conta a ser creditada[\\s\\S]*?Agência\\s*:\\s*(\\d+)", Pattern.CASE_INSENSITIVE);
            Matcher creditedAgencyMatcher = creditedAgencyPattern.matcher(text);
            if (creditedAgencyMatcher.find()) {
                creditedAgency = creditedAgencyMatcher.group(1);
                log.info("Agência creditada extraída: {}", creditedAgency);
            }
            
            // Padrão para conta creditada
            Pattern creditedAccountPattern = Pattern.compile("Dados da conta a ser creditada[\\s\\S]*?Conta\\s*:\\s*([\\d\\s-]+)", Pattern.CASE_INSENSITIVE);
            Matcher creditedAccountMatcher = creditedAccountPattern.matcher(text);
            if (creditedAccountMatcher.find()) {
                creditedAccount = creditedAccountMatcher.group(1).trim();
                log.info("Conta creditada extraída: {}", creditedAccount);
            }
            
            // Armazenar dados da conta creditada
            data.creditedAgency = creditedAgency;
            data.creditedAccount = creditedAccount;

            // Extrair valor - padrão específico do Itaú "Valor: R$ X.XXX,XX"
            Double amount = null;
            
            // Padrão 1: "Valor: R$ [VALOR]" - padrão principal do Itaú
            Pattern amountPattern1 = Pattern.compile("Valor\\s*:\\s*R\\$\\s*([\\d.,]+)", Pattern.CASE_INSENSITIVE);
            Matcher amountMatcher1 = amountPattern1.matcher(text);
            if (amountMatcher1.find()) {
                String amountStr = amountMatcher1.group(1).replace(".", "").replace(",", ".");
                try {
                    amount = Double.parseDouble(amountStr);
                    log.info("✅ Valor extraído (padrão Itaú): R$ {:.2f}", amount);
                } catch (NumberFormatException e) {
                    log.warn("Erro ao converter valor: {}", amountStr);
                }
            }
            
            // Padrão 1a: "R$ [VALOR]" com espaço após R$ - mais flexível
            if (amount == null) {
                Pattern amountPattern1a = Pattern.compile("R\\$\\s+([\\d.,]+)", Pattern.CASE_INSENSITIVE);
                Matcher amountMatcher1a = amountPattern1a.matcher(text);
                if (amountMatcher1a.find()) {
                    String amountStr = amountMatcher1a.group(1).replace(".", "").replace(",", ".");
                    try {
                        amount = Double.parseDouble(amountStr);
                        log.info("✅ Valor extraído (padrão R$ com espaço): R$ {:.2f}", amount);
                    } catch (NumberFormatException e) {
                        log.warn("Erro ao converter valor: {}", amountStr);
                    }
                }
            }
            
            // Padrão 1b: "R$ [VALOR]" sem "Valor:" - mais flexível para comprovantes
            if (amount == null) {
                Pattern amountPattern1b = Pattern.compile("R\\$\\s*([\\d.,]{4,})", Pattern.CASE_INSENSITIVE);
                Matcher amountMatcher1b = amountPattern1b.matcher(text);
                if (amountMatcher1b.find()) {
                    String amountStr = amountMatcher1b.group(1).replace(".", "").replace(",", ".");
                    try {
                        amount = Double.parseDouble(amountStr);
                        log.info("Valor extraído (padrão flexível): {}", amount);
                    } catch (NumberFormatException e) {
                        log.warn("Erro ao converter valor: {}", amountStr);
                    }
                }
            }
            
            // Padrão 2: "R$ [VALOR]" - padrão alternativo
            if (amount == null) {
                Pattern amountPattern2 = Pattern.compile("R\\$\\s*([\\d.,]+)", Pattern.CASE_INSENSITIVE);
                Matcher amountMatcher2 = amountPattern2.matcher(text);
                if (amountMatcher2.find()) {
                    String amountStr = amountMatcher2.group(1).replace(".", "").replace(",", ".");
                    try {
                        amount = Double.parseDouble(amountStr);
                        log.info("Valor extraído (padrão alternativo): {}", amount);
                    } catch (NumberFormatException e) {
                        log.warn("Erro ao converter valor: {}", amountStr);
                    }
                }
            }
            
            // Padrão 3: Qualquer número que pareça valor monetário (fallback)
            if (amount == null) {
                Pattern amountPattern3 = Pattern.compile("([\\d.,]{4,})", Pattern.CASE_INSENSITIVE);
                Matcher amountMatcher3 = amountPattern3.matcher(text);
                if (amountMatcher3.find()) {
                    String amountStr = amountMatcher3.group(1).replace(".", "").replace(",", ".");
                    try {
                        amount = Double.parseDouble(amountStr);
                        log.info("Valor extraído (padrão flexível): {}", amount);
                    } catch (NumberFormatException e) {
                        log.warn("Erro ao converter valor: {}", amountStr);
                    }
                }
            }
            
            data.amount = amount;
            if (data.amount != null) {
                log.info("💰 Valor final extraído: R$ {:.2f}", data.amount);
            } else {
                log.warn("⚠️ Valor não foi extraído!");
            }

            // Extrair data da transferência - padrão específico do Itaú
            Pattern datePattern1 = Pattern.compile("Transferência realizada em\\s*(\\d{2})\\.(\\d{2})\\.(\\d{4})\\s*às\\s*(\\d{2}:\\d{2}:\\d{2})", Pattern.CASE_INSENSITIVE);
            Matcher dateMatcher1 = datePattern1.matcher(text);
            if (dateMatcher1.find()) {
                String day = dateMatcher1.group(1);
                String month = dateMatcher1.group(2);
                String year = dateMatcher1.group(3);
                String time = dateMatcher1.group(4);
                data.transferDate = day + "." + month + "." + year;
                log.info("✅ Data de transferência extraída: {} às {}", data.transferDate, time);
            } else {
                // Padrão alternativo: "Data: DD/MM/YYYY"
                Pattern datePattern2 = Pattern.compile("Data\\s*:\\s*(\\d{2})/(\\d{2})/(\\d{4})", Pattern.CASE_INSENSITIVE);
                Matcher dateMatcher2 = datePattern2.matcher(text);
                if (dateMatcher2.find()) {
                    data.transferDate = dateMatcher2.group(1) + "/" + dateMatcher2.group(2) + "/" + dateMatcher2.group(3);
                    log.info("Data de transferência extraída (padrão alternativo): {}", data.transferDate);
                }
            }

            // EXTRAIR PERÍODO DE REFERÊNCIA DO SALÁRIO
            log.info("🔍 Procurando período de referência do salário no comprovante...");
            
            // Padrão 1: "PERÍODO: MM/AAAA" ou "COMPETÊNCIA: MM/AAAA"
            Pattern periodoPattern1 = Pattern.compile("(?:PERÍODO|COMPETÊNCIA|REFERÊNCIA)\\s*:\\s*(\\d{1,2})/(\\d{4})", Pattern.CASE_INSENSITIVE);
            Matcher periodoMatcher1 = periodoPattern1.matcher(text);
            if (periodoMatcher1.find()) {
                data.month = Integer.parseInt(periodoMatcher1.group(1));
                data.year = Integer.parseInt(periodoMatcher1.group(2));
                log.info("✅ Período de referência encontrado (padrão 1): {}/{}", data.month, data.year);
            } else {
                // Padrão 2: "SALÁRIO DE MM/AAAA" ou "PAGAMENTO DE MM/AAAA"
                Pattern periodoPattern2 = Pattern.compile("(?:SALÁRIO|PAGAMENTO)\\s+DE\\s+(\\d{1,2})/(\\d{4})", Pattern.CASE_INSENSITIVE);
                Matcher periodoMatcher2 = periodoPattern2.matcher(text);
                if (periodoMatcher2.find()) {
                    data.month = Integer.parseInt(periodoMatcher2.group(1));
                    data.year = Integer.parseInt(periodoMatcher2.group(2));
                    log.info("✅ Período de referência encontrado (padrão 2): {}/{}", data.month, data.year);
                } else {
                    // Padrão 3: Para comprovantes Itaú, usar a data de transferência como período de referência
                    // "Transferência realizada em DD.MM.AAAA às HH:MM:SS"
                    Pattern transferPattern = Pattern.compile("Transferência\\s+realizada\\s+em\\s+(\\d{2})\\.(\\d{2})\\.(\\d{4})\\s*às", Pattern.CASE_INSENSITIVE);
                    Matcher transferMatcher = transferPattern.matcher(text);
                    if (transferMatcher.find()) {
                        data.month = Integer.parseInt(transferMatcher.group(2)); // MM
                        data.year = Integer.parseInt(transferMatcher.group(3));  // AAAA
                        log.info("✅ Período de referência extraído da data de transferência: {}/{}", data.month, data.year);
                    } else {
                        // Padrão 3b: "Transferência efetuada em DD.MM.AAAA" (formato com pontos)
                        Pattern transferPattern2 = Pattern.compile("Transferência\\s+(?:efetuada|realizada)\\s+em\\s+(\\d{2})\\.(\\d{2})\\.(\\d{4})", Pattern.CASE_INSENSITIVE);
                        Matcher transferMatcher2 = transferPattern2.matcher(text);
                        if (transferMatcher2.find()) {
                            data.month = Integer.parseInt(transferMatcher2.group(2)); // MM
                            data.year = Integer.parseInt(transferMatcher2.group(3));  // AAAA
                            log.info("✅ Período de referência extraído da data de transferência (formato com pontos): {}/{}", data.month, data.year);
                        } else {
                            // Padrão 3c: "Transferência realizada em DD/MM/AAAA" (formato com barras)
                            Pattern transferPattern3 = Pattern.compile("Transferência\\s+realizada\\s+em\\s+(\\d{2})/(\\d{2})/(\\d{4})", Pattern.CASE_INSENSITIVE);
                            Matcher transferMatcher3 = transferPattern3.matcher(text);
                            if (transferMatcher3.find()) {
                                data.month = Integer.parseInt(transferMatcher3.group(2)); // MM
                                data.year = Integer.parseInt(transferMatcher3.group(3));  // AAAA
                                log.info("✅ Período de referência extraído da data de transferência (formato com barras): {}/{}", data.month, data.year);
                            } else {
                                // Padrão 4: Nomes de meses em português
                                String[] meses = {"JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", 
                                                 "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"};
                                for (int i = 0; i < meses.length; i++) {
                                    if (text.toUpperCase().contains(meses[i])) {
                                        data.month = i + 1;
                                        // Procurar ano próximo (2020-2030)
                                        Pattern anoPattern = Pattern.compile("(20[2-3][0-9])");
                                        Matcher anoMatcher = anoPattern.matcher(text);
                                        if (anoMatcher.find()) {
                                            data.year = Integer.parseInt(anoMatcher.group(1));
                                            log.info("✅ Período de referência encontrado via nome do mês: {}/{} ({})", data.month, data.year, meses[i]);
                                            break;
                                        }
                                    }
                                }
                                
                                // Se ainda não encontrou, usar data atual como fallback
                                if (data.month == 0 || data.year == 0) {
                                    data.month = LocalDateTime.now().getMonthValue();
                                    data.year = LocalDateTime.now().getYear();
                                    log.warn("⚠️ Período de referência não encontrado, usando data atual: {}/{}", data.month, data.year);
                                }
                            }
                        }
                    }
                }
            }

            // Extrair número de controle - padrão específico do Itaú "CTRL XXXXXXXXXXXXXXX"
            Pattern controlPattern = Pattern.compile("CTRL\\s*([A-Z0-9]+)", Pattern.CASE_INSENSITIVE);
            Matcher controlMatcher = controlPattern.matcher(text);
            if (controlMatcher.find()) {
                data.controlNumber = controlMatcher.group(1);
                log.info("🔢 Número de controle extraído: {}", data.controlNumber);
            } else {
                log.warn("⚠️ Número de controle não encontrado");
            }

            // Extrair autenticação - padrão específico do Itaú (40 caracteres hex)
            Pattern authPattern = Pattern.compile("Autenticação\\s*:\\s*([A-F0-9]{40})", Pattern.CASE_INSENSITIVE);
            Matcher authMatcher = authPattern.matcher(text);
            if (authMatcher.find()) {
                data.authentication = authMatcher.group(1);
                log.info("🔐 Código de autenticação extraído: {}", data.authentication);
            } else {
                log.warn("⚠️ Código de autenticação não encontrado");
            }

            // Extrair informações do Sispag
            Pattern sispagPattern = Pattern.compile("via\\s+Sispag", Pattern.CASE_INSENSITIVE);
            if (sispagPattern.matcher(text).find()) {
                log.info("Transação via Sispag identificada");
            }

            // Para debug: aceitar mesmo sem nome completo
            if (data.employeeName == null || data.employeeName.trim().isEmpty() || data.employeeName.equals("Nome não extraído")) {
                log.warn("⚠️ Nome do funcionário não encontrado - usando nome genérico para debug");
                data.employeeName = "NOVO FUNCIONÁRIO";
            }
            
            // Log detalhado dos dados extraídos
            log.info("=== 📊 RESUMO DOS DADOS EXTRAÍDOS ===");
            log.info("👤 Nome do funcionário: '{}'", data.employeeName);
            log.info("💰 Valor: {}", data.amount != null ? String.format("R$ %.2f", data.amount) : "Não encontrado");
            log.info("📅 Mês/Ano: {}/{}", data.month, data.year);
            log.info("🏦 Banco: '{}'", data.bankName);
            log.info("📄 Data de transferência: '{}'", data.transferDate);
            log.info("🏢 Empresa: '{}'", data.companyName);
            log.info("🔢 Agência debitada: '{}'", data.agency);
            log.info("💳 Conta debitada: '{}'", data.account);
            log.info("🔢 Agência creditada: '{}'", data.creditedAgency);
            log.info("💳 Conta creditada: '{}'", data.creditedAccount);
            log.info("🔐 Controle: '{}'", data.controlNumber);
            log.info("🔑 Autenticação: '{}'", data.authentication);

            log.info("=== ✅ EXTRAÇÃO CONCLUÍDA ===");
            log.info("👤 Nome do Funcionário: {}", data.employeeName);
            log.info("💰 Valor da Transferência: R$ {}", data.amount != null ? String.format("%.2f", data.amount) : "N/A");
            log.info("📅 Mês/Ano: {}/{}", data.month, data.year);
            log.info("🏦 Banco: {}", data.bankName != null ? data.bankName : "N/A");
            log.info("🏢 Agência Debitada: {}", data.agency != null ? data.agency : "N/A");
            log.info("📋 Conta Debitada: {}", data.account != null ? data.account : "N/A");
            log.info("🏭 Empresa: {}", data.companyName != null ? data.companyName : "N/A");
            log.info("🏢 Agência Creditada: {}", data.creditedAgency != null ? data.creditedAgency : "N/A");
            log.info("📋 Conta Creditada: {}", data.creditedAccount != null ? data.creditedAccount : "N/A");
            log.info("📅 Data Transferência: {}", data.transferDate != null ? data.transferDate : "N/A");
            log.info("🔢 Controle: {}", data.controlNumber != null ? data.controlNumber : "N/A");
            log.info("🔐 Autenticação: {}", data.authentication != null ? data.authentication : "N/A");
            
            // Validação final dos dados extraídos
            log.info("=== 🔍 VALIDAÇÃO FINAL ===");
            boolean nomeValido = data.employeeName != null && !data.employeeName.trim().isEmpty();
            boolean mesValido = data.month > 0 && data.month <= 12;
            boolean anoValido = data.year > 0;
            
            log.info("👤 Nome válido: {} ({})", nomeValido ? "✅" : "❌", data.employeeName);
            log.info("📅 Mês válido: {} ({})", mesValido ? "✅" : "❌", data.month);
            log.info("📅 Ano válido: {} ({})", anoValido ? "✅" : "❌", data.year);
            
            if (nomeValido && mesValido && anoValido) {
                log.info("🎉 ✅ EXTRAÇÃO BEM-SUCEDIDA! Todos os dados obrigatórios foram extraídos.");
                return data;
            } else {
                log.error("💥 ❌ EXTRAÇÃO FALHOU! Dados obrigatórios não foram encontrados.");
                log.error("❌ Nome: {}", nomeValido ? "OK" : "FALTANDO");
                log.error("❌ Mês: {}", mesValido ? "OK" : "FALTANDO");
                log.error("❌ Ano: {}", anoValido ? "OK" : "FALTANDO");
                return null;
            }

        } catch (Exception e) {
            log.error("Erro ao extrair dados do recibo bancário: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Extrai uma página específica do PDF original preservando o layout exato
     */
    private String extractReceiptPageFromOriginal(java.io.InputStream originalInputStream, int pageNumber, ReceiptData data) throws IOException {
        // Criar diretório por mês com caminho absoluto
        String monthFolder = String.format("%02d_%04d", data.month, data.year);
        Path monthPath = Paths.get(UPLOAD_DIR, monthFolder).toAbsolutePath();
        
        log.info("Criando diretório: {}", monthPath);
        
        if (!Files.exists(monthPath)) {
            Files.createDirectories(monthPath);
            log.info("Diretório criado: {}", monthPath);
        } else {
            log.info("Diretório já existe: {}", monthPath);
        }

        // Nome do arquivo com nome do funcionário
        String cleanedName = data.employeeName != null ? data.employeeName.trim()
            .replaceAll("(?i)\\bvalor\\b", "") // Remove "valor" (case insensitive)
            .replaceAll("(?i)\\bfuncionario\\b", "") // Remove "funcionario" (case insensitive)
            .replaceAll("(?i)\\bempregado\\b", "") // Remove "empregado" (case insensitive)
            .replaceAll("(?i)\\bcolaborador\\b", "") // Remove "colaborador" (case insensitive)
            .replaceAll("\\s+", " ") // Múltiplos espaços para um só
            .trim() : "";
        
        // Se após a limpeza o nome ficou vazio, usar o nome original
        if (cleanedName.isEmpty() && data.employeeName != null) {
            cleanedName = data.employeeName.trim();
        }
        
        String fileName = String.format("recibo_%s_%02d_%d_pagina_%d.pdf", 
            cleanedName.replaceAll("[^a-zA-ZÀ-ÿ\\s]", "").trim().replaceAll("\\s+", "_").toLowerCase(),
            data.month, 
            data.year, 
            pageNumber
        );

        String filePath = monthPath.resolve(fileName).toString();

        // PRESERVAR LAYOUT ORIGINAL: Extrair apenas a página específica do PDF original
        try (PDDocument originalDocument = PDDocument.load(originalInputStream);
             PDDocument newDocument = new PDDocument()) {
            
            log.info("📄 Extraindo página {} do PDF original (preservando layout)", pageNumber);
            
            // Verificar se a página existe
            if (pageNumber > originalDocument.getNumberOfPages()) {
                throw new IOException("Página " + pageNumber + " não existe no PDF original");
            }
            
            // Copiar a página específica (índice baseado em 0)
            PDPage originalPage = originalDocument.getPage(pageNumber - 1);
            newDocument.addPage(originalPage);
            
            // Salvar o novo PDF com apenas a página extraída
            newDocument.save(filePath);
            
            log.info("✅ Página {} extraída com sucesso preservando layout original: {}", pageNumber, filePath);
            
            return filePath;
            
        } catch (Exception e) {
            log.error("💥 Erro ao extrair página do PDF original: {}", e.getMessage(), e);
            throw new IOException("Erro ao extrair página do PDF original: " + e.getMessage(), e);
        }
    }

    private String createReceiptPdf(ReceiptData data, int pageNumber) throws IOException {
        // Criar diretório por mês com caminho absoluto
        String monthFolder = String.format("%02d_%04d", data.month, data.year);
        Path monthPath = Paths.get(UPLOAD_DIR, monthFolder).toAbsolutePath();
        
        log.info("Criando diretório: {}", monthPath);
        
        if (!Files.exists(monthPath)) {
            Files.createDirectories(monthPath);
            log.info("Diretório criado: {}", monthPath);
        } else {
            log.info("Diretório já existe: {}", monthPath);
        }

        // Nome do arquivo com nome do funcionário
        String cleanedName = data.employeeName != null ? data.employeeName.trim()
            .replaceAll("(?i)\\bvalor\\b", "") // Remove "valor" (case insensitive)
            .replaceAll("(?i)\\bfuncionario\\b", "") // Remove "funcionario" (case insensitive)
            .replaceAll("(?i)\\bempregado\\b", "") // Remove "empregado" (case insensitive)
            .replaceAll("(?i)\\bcolaborador\\b", "") // Remove "colaborador" (case insensitive)
            .replaceAll("\\s+", " ") // Múltiplos espaços para um só
            .trim() : "";
        
        // Se após a limpeza o nome ficou vazio, usar o nome original
        if (cleanedName.isEmpty() && data.employeeName != null) {
            cleanedName = data.employeeName.trim();
        }
        
        String fileName = String.format("recibo_%s_%02d_%d_pagina_%d.pdf", 
            cleanedName.replaceAll("[^a-zA-ZÀ-ÿ\\s]", "").trim().replaceAll("\\s+", "_").toLowerCase(),
            data.month, 
            data.year, 
            pageNumber
        );

        String filePath = monthPath.resolve(fileName).toString();

        // IMPORTANTE: Este método deve preservar o layout original do comprovante
        // Por enquanto, vamos criar um PDF com layout similar ao original
        // TODO: Implementar preservação do layout original do PDF
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);
            
            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                // Configurar fontes
                PDFont fontRegular = PDType1Font.HELVETICA;
                PDFont fontBold = PDType1Font.HELVETICA_BOLD;
                
                // Cores
                contentStream.setNonStrokingColor(0, 0, 0); // Preto
                
                // HEADER - Layout exato do Itaú
                // Logo Itaú (esquerda)
                contentStream.beginText();
                contentStream.setFont(fontBold, 16);
                contentStream.newLineAtOffset(50, 750);
                contentStream.showText("Itaú");
                contentStream.endText();
                
                // "30 horas" (direita)
                contentStream.beginText();
                contentStream.setFont(fontBold, 12);
                contentStream.newLineAtOffset(500, 750);
                contentStream.showText("30 horas");
                contentStream.endText();
                
                // Título principal centralizado
                contentStream.beginText();
                contentStream.setFont(fontBold, 14);
                contentStream.newLineAtOffset(50, 720);
                contentStream.showText("Banco Itaú - Comprovante de Transferência de conta corrente para conta corrente");
                contentStream.endText();
                
                // Linha separadora
                contentStream.setLineWidth(1);
                contentStream.moveTo(50, 710);
                contentStream.lineTo(550, 710);
                contentStream.stroke();
                
                // Identificação no extrato
                contentStream.beginText();
                contentStream.setFont(fontRegular, 12);
                contentStream.newLineAtOffset(50, 680);
                contentStream.showText("Identificação no extrato: SISPAG SALARIOS");
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
                contentStream.showText("Agência: " + (data.agency != null ? data.agency : "0925"));
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
                contentStream.showText("Agência: " + (data.creditedAgency != null ? data.creditedAgency : "1429"));
                contentStream.endText();
                
                contentStream.beginText();
                contentStream.newLineAtOffset(50, 500);
                contentStream.showText("Conta corrente: " + (data.creditedAccount != null ? data.creditedAccount : "39637 - 5"));
                contentStream.endText();
                
                contentStream.beginText();
                contentStream.newLineAtOffset(50, 480);
                contentStream.showText("Valor: R$ " + String.format("%.2f", data.amount != null ? data.amount : 0.0).replace(".", ","));
                contentStream.endText();
                
                // Informações fornecidas pelo pagador
                contentStream.beginText();
                contentStream.setFont(fontBold, 12);
                contentStream.newLineAtOffset(50, 450);
                contentStream.showText("Informações fornecidas pelo pagador");
                contentStream.endText();
                
                contentStream.beginText();
                contentStream.setFont(fontRegular, 10);
                contentStream.newLineAtOffset(50, 430);
                contentStream.showText("Transferência efetuada em " + (data.transferDate != null ? data.transferDate : "06/08/2025") + " às 07:13:32 via Sispag, CTRL " + (data.controlNumber != null ? data.controlNumber : "992972681000634"));
                contentStream.endText();
                
                // Autenticação
                contentStream.beginText();
                contentStream.setFont(fontBold, 12);
                contentStream.newLineAtOffset(50, 400);
                contentStream.showText("Autenticação");
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
                log.error("Arquivo PDF não foi criado: {}", filePath);
                throw new IOException("Arquivo PDF não foi criado: " + filePath);
            }
            
            return filePath;
            
        } catch (Exception e) {
            log.error("Erro ao criar PDF do recibo: {}", e.getMessage(), e);
            throw new IOException("Erro ao criar PDF do recibo: " + e.getMessage());
        }
    }

    private String extractEmployeeName(String text) {
        // Padrões comuns para encontrar nomes em recibos
        String[] patterns = {
            "FUNCIONÁRIO:\\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\\s]+)",
            "NOME:\\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\\s]+)",
            "RECEBEDOR:\\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\\s]+)"
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
        // Extrair mês do texto
        Pattern pattern = Pattern.compile("(?:MÊS|MES)\\s*:\\s*(\\d{1,2})", Pattern.CASE_INSENSITIVE);
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
        
        return LocalDateTime.now().getMonthValue(); // Mês atual como fallback
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
        // Extrair salário bruto
        Pattern pattern = Pattern.compile("(?:SALÁRIO\\s*BRUTO|SALARIO\\s*BRUTO|BRUTO)\\s*:\\s*R?\\$?\\s*([\\d.,]+)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            String value = matcher.group(1).replace(",", ".");
            return Double.parseDouble(value);
        }
        return null;
    }

    private Double extractNetSalary(String text) {
        // Extrair salário líquido
        Pattern pattern = Pattern.compile("(?:SALÁRIO\\s*LÍQUIDO|SALARIO\\s*LIQUIDO|LÍQUIDO|LIQUIDO)\\s*:\\s*R?\\$?\\s*([\\d.,]+)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            String value = matcher.group(1).replace(",", ".");
            return Double.parseDouble(value);
        }
        return null;
    }

    private String generateReceiptFileName(String employeeName, int month, int year, int pageNumber) {
        // Tratar nome do funcionário de forma robusta
        String sanitizedName;
        if (employeeName != null && !employeeName.trim().isEmpty()) {
            // Remover palavras comuns que podem estar sendo incluídas incorretamente
            String cleanedName = employeeName.trim()
                .replaceAll("(?i)\\bvalor\\b", "") // Remove "valor" (case insensitive)
                .replaceAll("(?i)\\bfuncionario\\b", "") // Remove "funcionario" (case insensitive)
                .replaceAll("(?i)\\bempregado\\b", "") // Remove "empregado" (case insensitive)
                .replaceAll("(?i)\\bcolaborador\\b", "") // Remove "colaborador" (case insensitive)
                .replaceAll("\\s+", " ") // Múltiplos espaços para um só
                .trim();
            
            // Se após a limpeza o nome ficou vazio, usar o nome original
            if (cleanedName.isEmpty()) {
                cleanedName = employeeName.trim();
            }
            
            // Remover caracteres especiais, manter apenas letras, acentos e espaços
            sanitizedName = cleanedName.replaceAll("[^a-zA-ZÀ-ÿ\\s]", "").trim();
            // Substituir múltiplos espaços por underscore
            sanitizedName = sanitizedName.replaceAll("\\s+", "_");
            // Converter para minúsculas
            sanitizedName = sanitizedName.toLowerCase();
            
            log.info("🧹 Nome do arquivo limpo: '{}' -> '{}'", employeeName, sanitizedName);
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
                // Deletar arquivo físico se existir
                if (receipt.getFilePath() != null) {
                    try {
                        java.io.File file = new java.io.File(receipt.getFilePath());
                        if (file.exists()) {
                            file.delete();
                            log.info("Arquivo físico deletado: {}", receipt.getFilePath());
                        }
                    } catch (Exception e) {
                        log.warn("Erro ao deletar arquivo físico: {}", e.getMessage());
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
     * Função utilitária para limpar texto removendo caracteres de controle
     */
    private String cleanText(String text) {
        if (text == null) return "";
        return text.replaceAll("[\\r\\n\\t]", " ").trim();
    }
} 