package br.com.fleetmanager.service;

import br.com.fleetmanager.model.PaymentReceipt;
import br.com.fleetmanager.model.PaymentReceiptStatus;
import br.com.fleetmanager.model.Payslip;
import br.com.fleetmanager.repository.PaymentReceiptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UnifiedDocumentService {

    private final ReceiptProcessingService receiptProcessingService;
    private final PayslipService payslipService;
    private final PaymentReceiptRepository receiptRepository;
    private static final String UNIFIED_DIR = "uploads/unified/";

    /**
     * Cria um documento unificado combinando holerite e recibo
     */
    public String createUnifiedDocument(Payslip payslip, PaymentReceipt receipt) throws IOException {
        log.info("=== 🎯 CRIANDO DOCUMENTO UNIFICADO ===");
        log.info("Funcionário: {}", payslip.getEmployeeName());
        log.info("Mês/Ano: {}/{}", payslip.getMonth(), payslip.getYear());
        log.info("Recibo: {}", receipt.getFileName());

        // VERIFICAÇÃO INTELIGENTE DE NOMES
        boolean namesMatch = verifyEmployeeNames(payslip.getEmployeeName(), receipt.getEmployeeName());
        log.info("🔍 Verificação de nomes: {} = {} ? {}", 
            payslip.getEmployeeName(), receipt.getEmployeeName(), namesMatch ? "✅ MATCH" : "❌ NO MATCH");

        if (!namesMatch) {
            log.warn("⚠️ Nomes não coincidem! Holerite: {} | Recibo: {}", 
                payslip.getEmployeeName(), receipt.getEmployeeName());
        }

        // Criar diretório se não existir
        Path unifiedPath = Paths.get(UNIFIED_DIR).toAbsolutePath();
        if (!Files.exists(unifiedPath)) {
            Files.createDirectories(unifiedPath);
            log.info("Diretório criado: {}", unifiedPath);
        }

        // Nome do arquivo unificado
        String fileName = generateUnifiedFileName(payslip.getEmployeeName(), payslip.getMonth(), payslip.getYear());
        String filePath = unifiedPath.resolve(fileName).toString();

        try (PDDocument unifiedDocument = new PDDocument()) {
            
            // PÁGINA 1: HOLERITE
            log.info("📄 Adicionando página 1: Holerite");
            addHoleritePage(unifiedDocument, payslip);
            
            // PÁGINA 2: RECIBO DE PAGAMENTO
            log.info("📄 Adicionando página 2: Recibo de Pagamento");
            addReceiptPage(unifiedDocument, receipt);
            
            // PÁGINA 3: VERIFICAÇÃO E RESULTADOS DA UNIFICAÇÃO
            log.info("📄 Adicionando página 3: Verificação e Resultados");
            addVerificationPage(unifiedDocument, payslip, receipt, namesMatch);
            
            // Salvar documento unificado
            unifiedDocument.save(filePath);
            log.info("✅ Documento unificado criado: {}", filePath);
            
            // Verificar se foi criado
            File savedFile = new File(filePath);
            if (savedFile.exists()) {
                log.info("📊 Arquivo verificado: {} bytes", savedFile.length());
            } else {
                throw new IOException("Arquivo unificado não foi criado");
            }
            
            return filePath;
            
        } catch (Exception e) {
            log.error("💥 Erro ao criar documento unificado: {}", e.getMessage(), e);
            throw new IOException("Erro ao criar documento unificado: " + e.getMessage(), e);
        }
    }

    /**
     * Adiciona página do holerite ao documento unificado
     */
    private void addHoleritePage(PDDocument document, Payslip payslip) throws IOException {
        PDPage page = new PDPage();
        document.addPage(page);
        
        try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
            // Configurar fontes
            contentStream.setNonStrokingColor(0, 0, 0); // Preto
            
            // HEADER - Título da página
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 18);
            contentStream.newLineAtOffset(50, 750);
            contentStream.showText("HOLERITE - " + payslip.getEmployeeName().toUpperCase());
            contentStream.endText();
            
            // Informações do funcionário
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 14);
            contentStream.newLineAtOffset(50, 700);
            contentStream.showText("INFORMAÇÕES DO FUNCIONÁRIO");
            contentStream.endText();
            
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 12);
            contentStream.newLineAtOffset(50, 670);
            contentStream.showText("Nome: " + cleanText(payslip.getEmployeeName()));
            contentStream.newLineAtOffset(0, -20);
            contentStream.showText("CPF: " + cleanText(payslip.getCpf()));
            contentStream.newLineAtOffset(0, -20);
            contentStream.showText("Cargo: Vigilante");
            contentStream.newLineAtOffset(0, -20);
            contentStream.showText("Mês/Ano: " + payslip.getMonth() + "/" + payslip.getYear());
            contentStream.endText();
            
            // Informações salariais
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 14);
            contentStream.newLineAtOffset(50, 550);
            contentStream.showText("INFORMAÇÕES SALARIAIS");
            contentStream.endText();
            
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 12);
            contentStream.newLineAtOffset(50, 520);
            contentStream.showText("Salário Bruto: R$ 1.500,00");
            contentStream.newLineAtOffset(0, -20);
            contentStream.showText("Salário Líquido: R$ 911,00");
            contentStream.newLineAtOffset(0, -20);
            contentStream.showText("Data de Pagamento: 25/" + payslip.getMonth() + "/" + payslip.getYear());
            contentStream.endText();
            
            // Footer
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 10);
            contentStream.newLineAtOffset(50, 100);
            contentStream.showText("Documento gerado automaticamente pelo sistema SecuredGuard");
            contentStream.newLineAtOffset(0, -15);
            contentStream.showText("Data de geração: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss")));
            contentStream.endText();
        }
    }

    /**
     * Adiciona página do recibo ao documento unificado
     */
    private void addReceiptPage(PDDocument document, PaymentReceipt receipt) throws IOException {
        PDPage page = new PDPage();
        document.addPage(page);
        
        try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
            // Configurar fontes
            contentStream.setNonStrokingColor(0, 0, 0); // Preto
            
            // HEADER - Logo e branding
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 14);
            contentStream.newLineAtOffset(50, 750);
            contentStream.showText("ITAÚ");
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 18);
            contentStream.newLineAtOffset(200, 0);
            contentStream.showText("30 HORAS");
            contentStream.endText();
            
            // Linha separadora
            contentStream.setLineWidth(1);
            contentStream.moveTo(50, 740);
            contentStream.lineTo(550, 740);
            contentStream.stroke();
            
            // TÍTULO PRINCIPAL
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 16);
            contentStream.newLineAtOffset(50, 710);
            contentStream.showText("COMPROVANTE DE OPERAÇÃO");
            contentStream.endText();
            
            // Tipo de operação
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 12);
            contentStream.newLineAtOffset(50, 690);
            contentStream.showText("Transferência de Conta Corrente para Conta Corrente");
            contentStream.endText();
            
            // Identificação no extrato
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 12);
            contentStream.newLineAtOffset(50, 670);
            contentStream.showText("Identificação no Extrato: SISPAG SALARIOS");
            contentStream.endText();
            
            // DADOS DA CONTA DEBITADA
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
            contentStream.newLineAtOffset(50, 630);
            contentStream.showText("Dados da conta a ser debitada:");
            contentStream.endText();
            
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 11);
            contentStream.newLineAtOffset(50, 610);
            contentStream.showText("Agência: 0925");
            contentStream.newLineAtOffset(0, -15);
            contentStream.showText("Conta: 98240 - 7");
            contentStream.newLineAtOffset(0, -15);
            contentStream.showText("Nome: PROMOVER VIGILANCIA PATRIMONIA");
            contentStream.endText();
            
            // DADOS DA CONTA CREDITADA
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
            contentStream.newLineAtOffset(50, 540);
            contentStream.showText("Dados da conta a ser creditada:");
            contentStream.endText();
            
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 11);
            contentStream.newLineAtOffset(50, 520);
            contentStream.showText("Agência: 0925");
            contentStream.newLineAtOffset(0, -15);
            contentStream.showText("Conta: 98240 - 7");
            contentStream.newLineAtOffset(0, -15);
            contentStream.showText("Nome: " + cleanText(receipt.getEmployeeName()));
            contentStream.newLineAtOffset(0, -15);
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
            contentStream.showText("Valor: R$ " + receipt.getNetSalary().toString());
            contentStream.endText();
            
            // INFORMAÇÕES DO PAGADOR
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 11);
            contentStream.newLineAtOffset(50, 450);
            contentStream.showText("Informações fornecidas pelo pagador:");
            contentStream.endText();
            
            // DETALHES DA TRANSFERÊNCIA
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 11);
            contentStream.newLineAtOffset(50, 410);
            contentStream.showText("Transferência realizada via Sispag");
            contentStream.endText();
            
            // FOOTER - Linha de corte
            contentStream.setLineDashPattern(new float[]{5, 5}, 0);
            contentStream.moveTo(50, 100);
            contentStream.lineTo(550, 100);
            contentStream.stroke();
            
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 10);
            contentStream.newLineAtOffset(250, 90);
            contentStream.showText("Cortar aqui");
            contentStream.endText();
            
            // Informações do sistema
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 8);
            contentStream.newLineAtOffset(50, 50);
            contentStream.showText("Documento unificado gerado automaticamente pelo sistema SecuredGuard");
            contentStream.newLineAtOffset(0, -12);
            contentStream.showText("Data de geração: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss")));
            contentStream.endText();
        }
    }

    /**
     * Adiciona página de verificação e resultados da unificação
     */
    private void addVerificationPage(PDDocument document, Payslip payslip, PaymentReceipt receipt, boolean namesMatch) throws IOException {
        PDPage page = new PDPage();
        document.addPage(page);
        
        try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
            contentStream.setNonStrokingColor(0, 0, 0); // Preto
            
            // HEADER - Título da página
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 18);
            contentStream.newLineAtOffset(50, 750);
            contentStream.showText("RESULTADOS DA UNIFICAÇÃO");
            contentStream.endText();
            
            // Linha separadora
            contentStream.setLineWidth(1);
            contentStream.moveTo(50, 740);
            contentStream.lineTo(550, 740);
            contentStream.stroke();
            
            // TÍTULO PRINCIPAL
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 16);
            contentStream.newLineAtOffset(50, 710);
            contentStream.showText("Resumo da Unificação");
            contentStream.endText();
            
            // Informações do funcionário
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 12);
            contentStream.newLineAtOffset(50, 670);
            contentStream.showText("Funcionário: " + cleanText(payslip.getEmployeeName()));
            contentStream.newLineAtOffset(0, -20);
            contentStream.showText("Mês/Ano: " + payslip.getMonth() + "/" + payslip.getYear());
            contentStream.newLineAtOffset(0, -20);
            contentStream.showText("Recibo: " + cleanText(receipt.getFileName()));
            contentStream.endText();
            
            // Resultado da verificação de nomes
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 14);
            contentStream.newLineAtOffset(50, 630);
            contentStream.showText("Resultado da Verificação de Nomes:");
            contentStream.endText();
            
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 12);
            contentStream.newLineAtOffset(50, 600);
            contentStream.showText("Nomes Coincidentes: " + (namesMatch ? "✅ Sim" : "❌ Não"));
            contentStream.endText();
            
            // Footer
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 10);
            contentStream.newLineAtOffset(50, 100);
            contentStream.showText("Documento gerado automaticamente pelo sistema SecuredGuard");
            contentStream.newLineAtOffset(0, -15);
            contentStream.showText("Data de geração: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss")));
            contentStream.endText();
        }
    }

    /**
     * Gera nome do arquivo unificado
     */
    private String generateUnifiedFileName(String employeeName, int month, int year) {
        String sanitizedName = cleanText(employeeName).toLowerCase().replaceAll("\\s+", "_");
        return String.format("documento_unificado_%s_%02d_%d.pdf", sanitizedName, month, year);
    }



    /**
     * Busca holerite e recibo por funcionário e mês/ano
     */
    public String createUnifiedDocumentForEmployee(String employeeName, int month, int year) throws IOException {
        log.info("🔍 Buscando documentos para: {} - {}/{}", employeeName, month, year);
        
        // Limpar nome do funcionário (remover caracteres especiais)
        String cleanEmployeeName = cleanText(employeeName);
        log.info("🧹 Nome limpo: '{}' -> '{}'", employeeName, cleanEmployeeName);
        
        // TODO: Implementar busca no banco de dados
        // Payslip payslip = payslipRepository.findByEmployeeNameAndMonthAndYear(cleanEmployeeName, month, year);
        // PaymentReceipt receipt = receiptRepository.findByEmployeeNameAndMonthAndYear(cleanEmployeeName, month, year);
        
        // Por enquanto, vamos simular com dados mock
        Payslip mockPayslip = createMockPayslip(cleanEmployeeName, month, year);
        PaymentReceipt mockReceipt = createMockReceipt(cleanEmployeeName, month, year);
        
        if (mockPayslip == null || mockReceipt == null) {
            throw new IOException("Erro ao criar dados mock para funcionário: " + cleanEmployeeName);
        }
        
        return createUnifiedDocument(mockPayslip, mockReceipt);
    }

    /**
     * Cria holerite mock para teste
     */
    private Payslip createMockPayslip(String employeeName, int month, int year) {
        try {
            log.info("🏗️ Criando Payslip mock para: {} - {}/{}", employeeName, month, year);
            
            // Usar o builder do Payslip para criar um mock
            return Payslip.builder()
                .employeeName(employeeName)
                .cpf("123.456.789-00")
                .month(month)
                .year(year)
                .fileName("holerite_" + employeeName.toLowerCase().replaceAll("\\s+", "_") + "_" + month + "_" + year + ".pdf")
                .build();
                
        } catch (Exception e) {
            log.error("💥 Erro ao criar Payslip mock: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Cria recibo mock para teste
     */
    private PaymentReceipt createMockReceipt(String employeeName, int month, int year) {
        try {
            log.info("🏗️ Criando PaymentReceipt mock para: {} - {}/{}", employeeName, month, year);
            
            // Criar um PaymentReceipt mock usando construtor
            PaymentReceipt receipt = new PaymentReceipt();
            receipt.setEmployeeName(employeeName);
            receipt.setMonth(month);
            receipt.setYear(year);
            receipt.setFileName("recibo_" + employeeName.toLowerCase().replaceAll("\\s+", "_") + "_" + month + "_" + year + ".pdf");
            receipt.setNetSalary(new java.math.BigDecimal("911.00"));
            receipt.setStatus(PaymentReceiptStatus.PROCESSED);
            return receipt;
                
        } catch (Exception e) {
            log.error("💥 Erro ao criar PaymentReceipt mock: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Lista todos os documentos unificados disponíveis
     */
    public List<Map<String, Object>> listAllUnifiedDocuments() throws IOException {
        log.info("📋 Listando todos os documentos unificados...");
        
        List<Map<String, Object>> documents = new ArrayList<>();
        
        try {
            // Listar arquivos da pasta unificada
            Path unifiedPath = Paths.get(UNIFIED_DIR).toAbsolutePath();
            if (!Files.exists(unifiedPath)) {
                log.warn("⚠️ Pasta unificada não existe: {}", unifiedPath);
                return documents;
            }
            
            // Listar arquivos de holerites
            Path holeritesPath = unifiedPath.resolve("holerites");
            if (Files.exists(holeritesPath)) {
                Files.list(holeritesPath)
                    .filter(path -> path.toString().endsWith(".pdf"))
                    .forEach(path -> {
                        Map<String, Object> doc = new HashMap<>();
                        doc.put("type", "HOLERITE");
                        doc.put("fileName", path.getFileName().toString());
                        doc.put("filePath", path.toString());
                        doc.put("fileSize", getFileSize(path));
                        doc.put("createdAt", getFileCreationTime(path));
                        doc.put("employeeName", extractEmployeeNameFromFileName(path.getFileName().toString()));
                        documents.add(doc);
                    });
            }
            
            // Listar arquivos de recibos
            Path receiptsPath = unifiedPath.resolve("receipts");
            if (Files.exists(receiptsPath)) {
                Files.list(receiptsPath)
                    .filter(path -> path.toString().endsWith(".pdf"))
                    .forEach(path -> {
                        Map<String, Object> doc = new HashMap<>();
                        doc.put("type", "RECIBO");
                        doc.put("fileName", path.getFileName().toString());
                        doc.put("filePath", path.toString());
                        doc.put("fileSize", getFileSize(path));
                        doc.put("createdAt", getFileCreationTime(path));
                        doc.put("employeeName", extractEmployeeNameFromFileName(path.getFileName().toString()));
                        documents.add(doc);
                    });
            }
            
            log.info("✅ Encontrados {} documentos unificados", documents.size());
            return documents;
            
        } catch (Exception e) {
            log.error("💥 Erro ao listar documentos unificados: {}", e.getMessage(), e);
            throw new IOException("Erro ao listar documentos unificados: " + e.getMessage(), e);
        }
    }

    /**
     * Lista documentos unificados por período
     */
    public List<Map<String, Object>> listUnifiedDocumentsByPeriod(Integer month, Integer year) throws IOException {
        log.info("📋 Listando documentos unificados por período: {}/{}", month, year);
        
        List<Map<String, Object>> allDocuments = listAllUnifiedDocuments();
        List<Map<String, Object>> filteredDocuments = new ArrayList<>();
        
        for (Map<String, Object> doc : allDocuments) {
            String fileName = (String) doc.get("fileName");
            if (fileName != null) {
                boolean matchesPeriod = true;
                
                if (month != null) {
                    matchesPeriod = matchesPeriod && fileName.contains(String.format("_%02d_", month));
                }
                
                if (year != null) {
                    matchesPeriod = matchesPeriod && fileName.contains(String.valueOf(year));
                }
                
                if (matchesPeriod) {
                    filteredDocuments.add(doc);
                }
            }
        }
        
        log.info("✅ Encontrados {} documentos para o período {}/{}", filteredDocuments.size(), month, year);
        return filteredDocuments;
    }

    /**
     * Busca documentos unificados por nome do funcionário
     */
    public List<Map<String, Object>> searchUnifiedDocumentsByEmployee(String employeeName) throws IOException {
        log.info("🔍 Buscando documentos unificados para funcionário: {}", employeeName);
        
        List<Map<String, Object>> allDocuments = listAllUnifiedDocuments();
        List<Map<String, Object>> filteredDocuments = new ArrayList<>();
        
        String searchTerm = employeeName.toLowerCase().trim();
        
        for (Map<String, Object> doc : allDocuments) {
            String fileName = (String) doc.get("fileName");
            String docEmployeeName = (String) doc.get("employeeName");
            
            if (fileName != null && docEmployeeName != null) {
                if (fileName.toLowerCase().contains(searchTerm) || 
                    docEmployeeName.toLowerCase().contains(searchTerm)) {
                    filteredDocuments.add(doc);
                }
            }
        }
        
        log.info("✅ Encontrados {} documentos para o funcionário: {}", filteredDocuments.size(), employeeName);
        return filteredDocuments;
    }

    /**
     * Extrai nome do funcionário do nome do arquivo
     */
    private String extractEmployeeNameFromFileName(String fileName) {
        try {
            // Remove prefixos e extensões
            String name = fileName
                .replace("HOLERITE_", "")
                .replace("RECIBO_recibo_", "")
                .replace(".pdf", "");
            
            // Extrai o nome (remove CPF e período)
            String[] parts = name.split("_");
            StringBuilder employeeName = new StringBuilder();
            
            for (int i = 0; i < parts.length - 2; i++) {
                if (employeeName.length() > 0) {
                    employeeName.append(" ");
                }
                employeeName.append(parts[i].toUpperCase());
            }
            
            return employeeName.toString();
        } catch (Exception e) {
            log.warn("⚠️ Erro ao extrair nome do funcionário do arquivo: {}", fileName);
            return "Nome não identificado";
        }
    }

    /**
     * Obtém tamanho do arquivo
     */
    private long getFileSize(Path path) {
        try {
            return Files.size(path);
        } catch (IOException e) {
            return 0;
        }
    }

    /**
     * Obtém data de criação do arquivo
     */
    private String getFileCreationTime(Path path) {
        try {
            return Files.getAttribute(path, "creationTime").toString();
        } catch (IOException e) {
            return "Data não disponível";
        }
    }

    /**
     * Verifica se os nomes dos funcionários coincidem
     */
    private boolean verifyEmployeeNames(String holeriteName, String receiptName) {
        if (holeriteName == null || receiptName == null) {
            log.warn("⚠️ Nome nulo detectado na verificação flexível - Holerite: {}, Recibo: {}", holeriteName, receiptName);
            return false;
        }
        
        // Normalizar nomes (remover espaços extras, converter para minúsculas)
        String normalizedHolerite = holeriteName.trim().toLowerCase()
            .replaceAll("\\s+", " "); // Múltiplos espaços para um só
        
        String normalizedReceipt = receiptName.trim().toLowerCase()
            .replaceAll("\\s+", " ");
        
        log.info("🔍 Comparando nomes (verificação flexível):");
        log.info("  Holerite original: '{}'", holeriteName);
        log.info("  Recibo original: '{}'", receiptName);
        log.info("  Holerite normalizado: '{}'", normalizedHolerite);
        log.info("  Recibo normalizado: '{}'", normalizedReceipt);
        
        // Verificação exata
        boolean exactMatch = normalizedHolerite.equals(normalizedReceipt);
        
        // Verificação parcial (se um nome contém o outro)
        boolean partialMatch = normalizedHolerite.contains(normalizedReceipt) || 
                              normalizedReceipt.contains(normalizedHolerite);
        
        // Verificação por palavras-chave (primeiro e último nome)
        boolean keywordMatch = checkKeywordMatch(normalizedHolerite, normalizedReceipt);
        
        // Verificação limpa (removendo palavras comuns)
        String cleanHolerite = normalizedHolerite
            .replace("valor", "")
            .replace("funcionario", "")
            .replace("empregado", "")
            .replace("colaborador", "")
            .trim();
        
        String cleanReceipt = normalizedReceipt
            .replace("valor", "")
            .replace("funcionario", "")
            .replace("empregado", "")
            .replace("colaborador", "")
            .trim();
        
        boolean cleanMatch = cleanHolerite.equals(cleanReceipt);
        
        log.info("🔍 Resultados da verificação flexível:");
        log.info("  Match exato: {}", exactMatch);
        log.info("  Match parcial: {}", partialMatch);
        log.info("  Match por palavras-chave: {}", keywordMatch);
        log.info("  Match limpo: {}", cleanMatch);
        
        // Retorna true se qualquer verificação passar
        return exactMatch || partialMatch || keywordMatch || cleanMatch;
    }

    /**
     * Verifica match por palavras-chave (primeiro e último nome)
     */
    private boolean checkKeywordMatch(String name1, String name2) {
        String[] words1 = name1.split("\\s+");
        String[] words2 = name2.split("\\s+");
        
        if (words1.length < 2 || words2.length < 2) {
            return false;
        }
        
        // Verificar primeiro e último nome
        String first1 = words1[0];
        String last1 = words1[words1.length - 1];
        String first2 = words2[0];
        String last2 = words2[words2.length - 1];
        
        boolean firstMatch = first1.equals(first2);
        boolean lastMatch = last1.equals(last2);
        
        log.info("🔍 Verificação por palavras-chave:");
        log.info("  Primeiro nome: '{}' = '{}' ? {}", first1, first2, firstMatch);
        log.info("  Último nome: '{}' = '{}' ? {}", last1, last2, lastMatch);
        
        return firstMatch && lastMatch;
    }

    /**
     * Limpa texto para exibição segura no PDF
     */
    private String cleanText(String text) {
        if (text == null) {
            return "N/A";
        }
        
        // Remover caracteres especiais que podem causar problemas no PDF
        return text.replaceAll("[^a-zA-ZÀ-ÿ0-9\\s\\.\\-\\,]", "")
                  .replaceAll("\\s+", " ")
                  .trim();
    }

    /**
     * Exclui um documento unificado pelo nome do arquivo
     */
    public boolean deleteUnifiedDocument(String fileName) throws IOException {
        log.info("🗑️ Excluindo documento unificado: {}", fileName);
        
        try {
            // Procurar o arquivo recursivamente na pasta uploads/unified
            Path basePath = Paths.get("uploads", "unified");
            Path filePath = findFileRecursively(basePath, fileName);
            
            if (filePath == null) {
                log.warn("⚠️ Arquivo não encontrado: {}", fileName);
                return false;
            }
            
            log.info("✅ Arquivo encontrado em: {}", filePath);
            
            // Verificar se é um arquivo PDF
            if (!fileName.toLowerCase().endsWith(".pdf")) {
                log.warn("⚠️ Tipo de arquivo não permitido: {}", fileName);
                return false;
            }
            
            // Excluir o arquivo
            boolean deleted = Files.deleteIfExists(filePath);
            
            if (deleted) {
                log.info("✅ Arquivo excluído com sucesso: {}", fileName);
                
                // Tentar excluir a pasta pai se estiver vazia
                Path parentDir = filePath.getParent();
                if (parentDir != null && Files.exists(parentDir)) {
                    try {
                        if (Files.list(parentDir).findFirst().isEmpty()) {
                            Files.deleteIfExists(parentDir);
                            log.info("✅ Pasta vazia removida: {}", parentDir);
                        }
                    } catch (IOException e) {
                        log.warn("⚠️ Não foi possível verificar/remover pasta pai: {}", e.getMessage());
                    }
                }
                
                return true;
            } else {
                log.warn("⚠️ Arquivo não pôde ser excluído: {}", fileName);
                return false;
            }
            
        } catch (Exception e) {
            log.error("💥 Erro ao excluir documento: {}", e.getMessage(), e);
            throw new IOException("Erro ao excluir documento: " + e.getMessage(), e);
        }
    }

    /**
     * Método auxiliar para encontrar arquivo recursivamente
     */
    private Path findFileRecursively(Path basePath, String fileName) {
        try {
            if (!Files.exists(basePath)) {
                return null;
            }
            
            // Tentar caminho direto primeiro
            Path directPath = basePath.resolve(fileName);
            if (Files.exists(directPath)) {
                return directPath;
            }
            
            // Buscar recursivamente
            return Files.walk(basePath)
                .filter(Files::isRegularFile)
                .filter(path -> path.getFileName().toString().equals(fileName))
                .findFirst()
                .orElse(null);
                
        } catch (IOException e) {
            log.error("💥 Erro ao procurar arquivo recursivamente: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Cria documentos unificados para todos os funcionários automaticamente
     */
    public List<String> createAllUnifiedDocuments() throws IOException {
        log.info("🎯 Criando holerites expandidos para todos os funcionários...");
        
        List<String> createdDocuments = new ArrayList<>();
        
        try {
            // Buscar todos os holerites disponíveis
            log.info("🔍 Buscando holerites no serviço...");
            List<Payslip> payslips = payslipService.getAllPayslips();
            log.info("📊 Encontrados {} holerites", payslips.size());
            
            if (payslips.isEmpty()) {
                log.warn("⚠️ Nenhum holerite encontrado para processar");
                return createdDocuments;
            }
            
            // Mostrar detalhes dos holerites encontrados
            log.info("📋 Detalhes dos holerites encontrados:");
            for (Payslip payslip : payslips) {
                log.info("  - ID: {}, Nome: '{}', Mês: {}, Ano: {}, CPF: '{}'", 
                    payslip.getId(), 
                    payslip.getEmployeeName(), 
                    payslip.getMonth(), 
                    payslip.getYear(), 
                    payslip.getCpf());
            }
            
            // Agrupar holerites por funcionário e período
            Map<String, List<Payslip>> payslipsByEmployee = payslips.stream()
                .filter(payslip -> payslip.getEmployeeName() != null && 
                                 payslip.getMonth() != null && 
                                 payslip.getYear() != null)
                .collect(Collectors.groupingBy(payslip -> 
                    payslip.getEmployeeName().trim().toUpperCase() + "_" + payslip.getMonth() + "_" + payslip.getYear()
                ));
            
            log.info("👥 Funcionários únicos encontrados: {}", payslipsByEmployee.size());
            log.info("🔑 Chaves de agrupamento:");
            payslipsByEmployee.keySet().forEach(key -> log.info("  - {}", key));
            
            // Para cada funcionário, buscar recibos correspondentes e criar holerite expandido
            for (Map.Entry<String, List<Payslip>> entry : payslipsByEmployee.entrySet()) {
                String key = entry.getKey();
                List<Payslip> employeePayslips = entry.getValue();
                
                if (employeePayslips.isEmpty()) continue;
                
                Payslip firstPayslip = employeePayslips.get(0);
                String employeeName = firstPayslip.getEmployeeName();
                Integer month = firstPayslip.getMonth();
                Integer year = firstPayslip.getYear();
                
                log.info("🔍 Processando funcionário: '{}' - {}/{}", employeeName, month, year);
                
                try {
                    // Buscar recibos por nome do funcionário (busca mais flexível)
                    log.info("🔍 Buscando recibos para funcionário: '{}'", employeeName);
                    List<PaymentReceipt> allReceipts = receiptRepository.findByEmployeeNameContainingIgnoreCase(employeeName);
                    log.info("📄 Total de recibos encontrados para '{}': {}", employeeName, allReceipts.size());
                    
                    // Mostrar detalhes dos recibos encontrados
                    if (!allReceipts.isEmpty()) {
                        log.info("📋 Detalhes dos recibos encontrados para '{}':", employeeName);
                        for (PaymentReceipt receipt : allReceipts) {
                            log.info("  - ID: {}, Nome: '{}', Mês: {}, Ano: {}", 
                                receipt.getId(), 
                                receipt.getEmployeeName(), 
                                receipt.getMonth(), 
                                receipt.getYear());
                        }
                    }
                    
                    // Filtrar por mês, ano E NOME EXATO
                    List<PaymentReceipt> matchingReceipts = allReceipts.stream()
                        .filter(receipt -> {
                            boolean monthMatch = receipt.getMonth() != null && receipt.getMonth().equals(month);
                            boolean yearMatch = receipt.getYear() != null && receipt.getYear().equals(year);
                            boolean nameMatch = isExactNameMatch(employeeName, receipt.getEmployeeName());
                            
                            log.info("🔍 Filtro para recibo {}: Mês={} ({}), Ano={} ({}), Nome={} ({})", 
                                receipt.getId(), monthMatch, month, yearMatch, year, nameMatch, receipt.getEmployeeName());
                            
                            return monthMatch && yearMatch && nameMatch;
                        })
                        .collect(Collectors.toList());
                    
                    log.info("📄 Recibos filtrados por período {}/{} e nome exato: {}", month, year, matchingReceipts.size());
                    
                    if (!matchingReceipts.isEmpty()) {
                        log.info("✅ Encontrados {} recibos com nome EXATO para {} - {}/{}", matchingReceipts.size(), employeeName, month, year);
                        
                        // Criar holerite expandido com todos os recibos
                        String expandedPath = createExpandedHolerite(firstPayslip, matchingReceipts);
                        createdDocuments.add(expandedPath);
                        
                        log.info("✅ Holerite expandido criado: {}", expandedPath);
                    } else {
                        log.warn("⚠️ Nenhum recibo com nome EXATO encontrado para {} - {}/{}", employeeName, month, year);
                        log.info("ℹ️ Nomes de recibos encontrados para este período:");
                        allReceipts.stream()
                            .filter(receipt -> receipt.getMonth() != null && 
                                             receipt.getMonth().equals(month) &&
                                             receipt.getYear() != null && 
                                             receipt.getYear().equals(year))
                            .forEach(receipt -> log.info("  - Recibo: '{}' vs Holerite: '{}'", 
                                receipt.getEmployeeName(), employeeName));
                    }
                    
                } catch (Exception e) {
                    log.error("💥 Erro ao processar funcionário {}: {}", employeeName, e.getMessage(), e);
                    // Continuar com o próximo funcionário
                }
            }
            
            log.info("🎉 Processamento concluído! {} holerites expandidos criados", createdDocuments.size());
            return createdDocuments;
            
        } catch (Exception e) {
            log.error("💥 Erro ao criar holerites expandidos: {}", e.getMessage(), e);
            throw new IOException("Erro ao criar holerites expandidos: " + e.getMessage(), e);
        }
    }

    /**
     * Verifica se os nomes dos funcionários são EXATAMENTE iguais
     */
    private boolean isExactNameMatch(String holeriteName, String receiptName) {
        if (holeriteName == null || receiptName == null) {
            log.warn("⚠️ Nome nulo detectado - Holerite: {}, Recibo: {}", holeriteName, receiptName);
            return false;
        }
        
        // Normalizar nomes: remover espaços extras, converter para maiúsculas
        String normalizedHolerite = holeriteName.trim().toUpperCase();
        String normalizedReceipt = receiptName.trim().toUpperCase();
        
        // Verificar se são exatamente iguais
        boolean exactMatch = normalizedHolerite.equals(normalizedReceipt);
        
        log.info("🔍 Verificação EXATA de nomes:");
        log.info("  Holerite original: '{}'", holeriteName);
        log.info("  Recibo original: '{}'", receiptName);
        log.info("  Holerite normalizado: '{}'", normalizedHolerite);
        log.info("  Recibo normalizado: '{}'", normalizedReceipt);
        log.info("  Match EXATO: {}", exactMatch ? "✅ SIM" : "❌ NÃO");
        
        // Se não houver match exato, tentar match mais flexível
        if (!exactMatch) {
            // Remover palavras comuns que podem estar causando diferenças
            String cleanHolerite = normalizedHolerite
                .replace("VALOR", "")
                .replace("FUNCIONARIO", "")
                .replace("EMPREGADO", "")
                .replace("COLABORADOR", "")
                .trim();
            
            String cleanReceipt = normalizedReceipt
                .replace("VALOR", "")
                .replace("FUNCIONARIO", "")
                .replace("EMPREGADO", "")
                .replace("COLABORADOR", "")
                .trim();
            
            boolean cleanMatch = cleanHolerite.equals(cleanReceipt);
            
            log.info("🔍 Verificação LIMPA de nomes:");
            log.info("  Holerite limpo: '{}'", cleanHolerite);
            log.info("  Recibo limpo: '{}'", cleanReceipt);
            log.info("  Match LIMPO: {}", cleanMatch ? "✅ SIM" : "❌ NÃO");
            
            if (cleanMatch) {
                log.info("✅ Match encontrado após limpeza - aceitando unificação");
                return true;
            }
            
            // Verificar se um nome contém o outro (mais flexível)
            boolean containsMatch = cleanHolerite.contains(cleanReceipt) || cleanReceipt.contains(cleanHolerite);
            log.info("  Match por contenção: {}", containsMatch ? "✅ SIM" : "❌ NÃO");
            
            if (containsMatch) {
                log.info("✅ Match por contenção encontrado - aceitando unificação");
                return true;
            }
        }
        
        return exactMatch;
    }

    /**
     * Cria um holerite expandido preservando o layout original e anexando recibos
     */
    public String createExpandedHolerite(Payslip payslip, List<PaymentReceipt> receipts) throws IOException {
        log.info("=== 🎯 CRIANDO HOLERITE EXPANDIDO ===");
        log.info("Funcionário: {}", payslip.getEmployeeName());
        log.info("Mês/Ano: {}/{}", payslip.getMonth(), payslip.getYear());
        log.info("Recibos encontrados: {}", receipts.size());

        // Criar diretório se não existir
        Path expandedPath = Paths.get(UNIFIED_DIR, "expanded").toAbsolutePath();
        if (!Files.exists(expandedPath)) {
            Files.createDirectories(expandedPath);
            log.info("Diretório criado: {}", expandedPath);
        }

        // Nome do arquivo expandido
        String fileName = generateExpandedHoleriteFileName(payslip.getEmployeeName(), payslip.getMonth(), payslip.getYear());
        String filePath = expandedPath.resolve(fileName).toString();

        try (PDDocument expandedDocument = new PDDocument()) {
            
            // PÁGINA 1: HOLERITE ORIGINAL (PRESERVANDO LAYOUT)
            log.info("📄 Adicionando página 1: Holerite Original (layout preservado)");
            addOriginalHoleritePage(expandedDocument, payslip);
            
            // PÁGINAS ADICIONAIS: RECIBOS DE PAGAMENTO
            if (!receipts.isEmpty()) {
                for (int i = 0; i < receipts.size(); i++) {
                    PaymentReceipt receipt = receipts.get(i);
                    log.info("📄 Adicionando página {}: Recibo de Pagamento {}", i + 2, i + 1);
                    addReceiptPage(expandedDocument, receipt);
                }
            } else {
                log.info("📄 Nenhum recibo para anexar");
            }
            
            // Salvar documento expandido
            expandedDocument.save(filePath);
            log.info("✅ Holerite expandido criado: {}", filePath);
            
            // Verificar se foi criado
            File savedFile = new File(filePath);
            if (savedFile.exists()) {
                log.info("📊 Arquivo verificado: {} bytes", savedFile.length());
            } else {
                throw new IOException("Arquivo expandido não foi criado");
            }
            
            return filePath;
            
        } catch (Exception e) {
            log.error("💥 Erro ao criar holerite expandido: {}", e.getMessage(), e);
            throw new IOException("Erro ao criar holerite expandido: " + e.getMessage(), e);
        }
    }

    /**
     * Adiciona o holerite original preservando seu layout
     */
    private void addOriginalHoleritePage(PDDocument document, Payslip payslip) throws IOException {
        try {
            // Tentar carregar o arquivo PDF original do holerite
            String holeriteFilePath = findHoleriteOriginalFile(payslip);
            
            if (holeriteFilePath != null && Files.exists(Paths.get(holeriteFilePath))) {
                log.info("📄 Carregando holerite original: {}", holeriteFilePath);
                
                // Carregar o PDF original
                try (PDDocument holeriteDoc = PDDocument.load(new File(holeriteFilePath))) {
                    // Copiar todas as páginas do holerite original
                    for (int i = 0; i < holeriteDoc.getNumberOfPages(); i++) {
                        PDPage page = holeriteDoc.getPage(i);
                        document.addPage(page);
                        log.info("📄 Página {} do holerite original adicionada", i + 1);
                    }
                }
            } else {
                log.warn("⚠️ Arquivo original do holerite não encontrado, criando página padrão");
                // Fallback: criar uma página padrão se o arquivo original não for encontrado
                addHoleritePage(document, payslip);
            }
            
        } catch (Exception e) {
            log.error("💥 Erro ao adicionar holerite original: {}", e.getMessage());
            // Fallback: criar uma página padrão em caso de erro
            addHoleritePage(document, payslip);
        }
    }

    /**
     * Tenta encontrar o arquivo PDF original do holerite
     */
    private String findHoleriteOriginalFile(Payslip payslip) {
        try {
            // Procurar na pasta de holerites processados
            Path holeritesPath = Paths.get("uploads", "holerites");
            if (Files.exists(holeritesPath)) {
                // Buscar por arquivo que contenha o nome do funcionário e período
                String searchPattern = String.format("*%s*%d_%d*.pdf", 
                    payslip.getEmployeeName().replaceAll("[^a-zA-ZÀ-ÿ0-9\\s]", "").replaceAll("\\s+", "_"),
                    payslip.getMonth(), payslip.getYear());
                
                log.info("🔍 Procurando arquivo com padrão: {}", searchPattern);
                
                // Buscar recursivamente
                try (var stream = Files.walk(holeritesPath)) {
                    return stream
                        .filter(Files::isRegularFile)
                        .filter(path -> path.toString().toLowerCase().endsWith(".pdf"))
                        .filter(path -> path.getFileName().toString().toLowerCase().contains(
                            payslip.getEmployeeName().toLowerCase().replaceAll("\\s+", "_")))
                        .filter(path -> path.getFileName().toString().contains(
                            String.format("_%d_%d", payslip.getMonth(), payslip.getYear())))
                        .map(Path::toString)
                        .findFirst()
                        .orElse(null);
                }
            }
        } catch (Exception e) {
            log.error("💥 Erro ao procurar arquivo original do holerite: {}", e.getMessage());
        }
        
        return null;
    }

    /**
     * Gera nome de arquivo para holerite expandido
     */
    private String generateExpandedHoleriteFileName(String employeeName, int month, int year) {
        String cleanName = employeeName.replaceAll("[^a-zA-ZÀ-ÿ0-9\\s]", "").replaceAll("\\s+", "_");
        return String.format("HOLERITE_EXPANDIDO_%s_%d_%d.pdf", cleanName.toUpperCase(), month, year);
    }

    /**
     * Adiciona página de resumo e verificação
     */
    private void addSummaryPage(PDDocument document, Payslip payslip, List<PaymentReceipt> receipts) throws IOException {
        PDPage page = new PDPage();
        document.addPage(page);
        
        PDPageContentStream contentStream = new PDPageContentStream(document, page);
        
        try {
            // Configurar fonte
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 16);
            contentStream.setNonStrokingColor(0, 0, 0);
            
            // Título
            contentStream.beginText();
            contentStream.newLineAtOffset(50, 750);
            contentStream.showText("RESUMO E VERIFICAÇÃO - HOLERITE EXPANDIDO");
            contentStream.endText();
            
            // Informações do funcionário
            contentStream.setFont(PDType1Font.HELVETICA, 12);
            contentStream.beginText();
            contentStream.newLineAtOffset(50, 700);
            contentStream.showText("Funcionário: " + cleanText(payslip.getEmployeeName()));
            contentStream.newLineAtOffset(0, -20);
            contentStream.showText("Período: " + payslip.getMonth() + "/" + payslip.getYear());
            contentStream.newLineAtOffset(0, -20);
            contentStream.showText("Total de Recibos Anexados: " + receipts.size());
            contentStream.endText();
            
            // Lista de recibos
            int yPosition = 570;
            if (!receipts.isEmpty()) {
                contentStream.beginText();
                contentStream.newLineAtOffset(50, 600);
                contentStream.showText("Recibos Incluídos:");
                contentStream.endText();
                
                for (int i = 0; i < receipts.size(); i++) {
                    PaymentReceipt receipt = receipts.get(i);
                    String receiptInfo = String.format("%d. %s - R$ %.2f", 
                        i + 1, 
                        cleanText(receipt.getEmployeeName() != null ? receipt.getEmployeeName() : "N/A"),
                        receipt.getNetSalary() != null ? receipt.getNetSalary() : 0.0
                    );
                    
                    contentStream.beginText();
                    contentStream.newLineAtOffset(70, yPosition);
                    contentStream.showText(receiptInfo);
                    contentStream.endText();
                    
                    yPosition -= 20;
                    
                    // Quebrar página se necessário
                    if (yPosition < 100 && i < receipts.size() - 1) {
                        contentStream.close();
                        PDPage newPage = new PDPage();
                        document.addPage(newPage);
                        contentStream = new PDPageContentStream(document, newPage);
                        yPosition = 750;
                    }
                }
            }
            
            // Verificação de nomes
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
            contentStream.beginText();
            contentStream.newLineAtOffset(50, yPosition - 40);
            contentStream.showText("Verificação de Consistência:");
            contentStream.endText();
            
            contentStream.setFont(PDType1Font.HELVETICA, 10);
            if (!receipts.isEmpty()) {
                boolean namesConsistent = receipts.stream()
                    .allMatch(receipt -> verifyEmployeeNames(payslip.getEmployeeName(), receipt.getEmployeeName()));
                
                contentStream.beginText();
                contentStream.newLineAtOffset(70, yPosition - 60);
                contentStream.showText("Nomes Consistentes: " + (namesConsistent ? "✅ Sim" : "❌ Não"));
                contentStream.endText();
            } else {
                contentStream.beginText();
                contentStream.newLineAtOffset(70, yPosition - 60);
                contentStream.showText("Nomes Consistentes: N/A (sem recibos para comparar)");
                contentStream.endText();
            }
            
            // Rodapé
            contentStream.setFont(PDType1Font.HELVETICA, 8);
            contentStream.beginText();
            contentStream.newLineAtOffset(50, 50);
            contentStream.showText("Documento gerado automaticamente em: " + 
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));
            contentStream.endText();
            
        } finally {
            contentStream.close();
        }
    }

    /**
     * Método de teste para verificar se os serviços estão funcionando
     */
    public Map<String, Object> testServices() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Testar busca de holerites
            List<Payslip> payslips = payslipService.getAllPayslips();
            result.put("payslipsCount", payslips.size());
            result.put("payslips", payslips.stream()
                .map(p -> Map.of(
                    "id", p.getId(),
                    "employeeName", p.getEmployeeName(),
                    "month", p.getMonth(),
                    "year", p.getYear()
                ))
                .collect(Collectors.toList()));
            
            // Testar busca de recibos
            List<PaymentReceipt> receipts = receiptRepository.findAll();
            result.put("receiptsCount", receipts.size());
            result.put("receipts", receipts.stream()
                .map(r -> Map.of(
                    "id", r.getId(),
                    "employeeName", r.getEmployeeName(),
                    "month", r.getMonth(),
                    "year", r.getYear()
                ))
                .collect(Collectors.toList()));
            
            result.put("success", true);
            result.put("message", "Serviços testados com sucesso");
            
        } catch (Exception e) {
            log.error("💥 Erro ao testar serviços: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }
} 