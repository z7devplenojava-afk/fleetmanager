package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.PaymentReceipt;
import com.z7design.fleet_manager.model.PaymentReceiptStatus;
import com.z7design.fleet_manager.model.Payslip;
import com.z7design.fleet_manager.model.UnifiedDocument;
import com.z7design.fleet_manager.dto.PayslipOrganizationResponse;
import com.z7design.fleet_manager.repository.PaymentReceiptRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.UnifiedDocumentRepository;
import com.z7design.fleet_manager.repository.PayslipRepository;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.Employee;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.util.regex.Pattern;
import java.util.regex.Matcher;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Objects;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;
import java.util.HashSet;
import java.util.UUID;
import java.text.Normalizer;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UnifiedDocumentService {

    private final ReceiptProcessingService receiptProcessingService;
    private final PayslipService payslipService;
    private final PaymentReceiptRepository receiptRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final UnifiedDocumentRepository unifiedDocumentRepository;
    private final PayslipRepository payslipRepository;
    private final com.z7design.fleet_manager.repository.UnificationJobRepository unificationJobRepository;
    private final com.z7design.fleet_manager.repository.DeletionJobRepository deletionJobRepository;
    private static final String UNIFIED_DIR = "uploads/unified/";

    /**
     * Cria documento unificado usando IDs especÃ­ficos do payslip e receipt
     * Garante que os documentos corretos sejam usados na unificaÃ§Ã£o individual
     */
    public String createUnifiedDocumentByIds(java.util.UUID payslipId, java.util.UUID receiptId) throws IOException {
        log.info("ðŸŽ¯ Criando documento unificado por IDs: payslipId={}, receiptId={}", payslipId, receiptId);
        
        // Buscar payslip e receipt pelos IDs
        Payslip payslip = payslipRepository.findById(payslipId)
            .orElseThrow(() -> new IOException("Payslip nÃ£o encontrado com ID: " + payslipId));
        
        PaymentReceipt receipt = receiptRepository.findById(receiptId)
            .orElseThrow(() -> new IOException("PaymentReceipt nÃ£o encontrado com ID: " + receiptId));
        
        log.info("âœ… Payslip encontrado: {} - {}/{}", payslip.getEmployeeName(), payslip.getMonth(), payslip.getYear());
        log.info("âœ… Receipt encontrado: {} - {}/{}", receipt.getEmployeeName(), receipt.getMonth(), receipt.getYear());
        
        // Criar documento unificado usando os objetos encontrados
        return createUnifiedDocument(payslip, receipt);
    }

    /**
     * Cria um documento unificado combinando holerite e recibo
     */
    public String createUnifiedDocument(Payslip payslip, PaymentReceipt receipt) throws IOException {
        log.info("=== ðŸŽ¯ CRIANDO DOCUMENTO UNIFICADO ===");
        log.info("FuncionÃ¡rio: {}", payslip.getEmployeeName());
        log.info("MÃªs/Ano: {}/{}", payslip.getMonth(), payslip.getYear());
        log.info("Recibo: {}", receipt.getFileName());

        // VERIFICAÃ‡ÃƒO INTELIGENTE DE NOMES
        boolean namesMatch = verifyEmployeeNames(payslip.getEmployeeName(), receipt.getEmployeeName());
        log.info("ðŸ” VerificaÃ§Ã£o de nomes: {} = {} ? {}", 
            payslip.getEmployeeName(), receipt.getEmployeeName(), namesMatch ? "âœ… MATCH" : "âŒ NO MATCH");

        if (!namesMatch) {
            log.warn("âš ï¸ Nomes nÃ£o coincidem! Holerite: {} | Recibo: {}", 
                payslip.getEmployeeName(), receipt.getEmployeeName());
        }

        // Criar diretÃ³rio se nÃ£o existir
        Path unifiedPath = Paths.get(UNIFIED_DIR).toAbsolutePath();
        if (!Files.exists(unifiedPath)) {
            Files.createDirectories(unifiedPath);
            log.info("DiretÃ³rio criado: {}", unifiedPath);
        }

        // Nome do arquivo unificado
        String fileName = generateUnifiedFileName(payslip.getEmployeeName(), payslip.getMonth(), payslip.getYear());
        String filePath = unifiedPath.resolve(fileName).toString();

        try (PDDocument unifiedDocument = new PDDocument()) {
            
            // PÃGINA 1: HOLERITE
            log.info("ðŸ“„ Adicionando pÃ¡gina 1: Holerite");
            addHoleritePage(unifiedDocument, payslip);
            
            // PÃGINA 2: RECIBO DE PAGAMENTO
            log.info("ðŸ“„ Adicionando pÃ¡gina 2: Recibo de Pagamento");
            addReceiptPage(unifiedDocument, receipt);
            
            // PÃGINA 3: VERIFICAÃ‡ÃƒO E RESULTADOS DA UNIFICAÃ‡ÃƒO
            log.info("ðŸ“„ Adicionando pÃ¡gina 3: VerificaÃ§Ã£o e Resultados");
            addVerificationPage(unifiedDocument, payslip, receipt, namesMatch);
            
            // Salvar documento unificado
            unifiedDocument.save(filePath);
            log.info("âœ… Documento unificado criado: {}", filePath);
            
            // Verificar se foi criado
            File savedFile = new File(filePath);
            if (savedFile.exists()) {
                log.info("ðŸ“Š Arquivo verificado: {} bytes", savedFile.length());
            } else {
                throw new IOException("Arquivo unificado nÃ£o foi criado");
            }
            
            return filePath;
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao criar documento unificado: {}", e.getMessage(), e);
            throw new IOException("Erro ao criar documento unificado: " + e.getMessage(), e);
        }
    }

    /**
     * Adiciona pÃ¡gina do holerite ao documento unificado
     */
    private void addHoleritePage(PDDocument document, Payslip payslip) throws IOException {
        PDPage page = new PDPage();
        document.addPage(page);
        
        try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
            // Configurar fontes
            contentStream.setNonStrokingColor(0, 0, 0); // Preto
            
            // HEADER - TÃ­tulo da pÃ¡gina
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 18);
            contentStream.newLineAtOffset(50, 750);
            contentStream.showText("HOLERITE - " + payslip.getEmployeeName().toUpperCase());
            contentStream.endText();
            
            // InformaÃ§Ãµes do funcionÃ¡rio
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 14);
            contentStream.newLineAtOffset(50, 700);
            contentStream.showText("INFORMAÃ‡Ã•ES DO FUNCIONÃRIO");
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
            contentStream.showText("MÃªs/Ano: " + payslip.getMonth() + "/" + payslip.getYear());
            contentStream.endText();
            
            // InformaÃ§Ãµes salariais
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 14);
            contentStream.newLineAtOffset(50, 550);
            contentStream.showText("INFORMAÃ‡Ã•ES SALARIAIS");
            contentStream.endText();
            
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 12);
            contentStream.newLineAtOffset(50, 520);
            contentStream.showText("SalÃ¡rio Bruto: R$ 1.500,00");
            contentStream.newLineAtOffset(0, -20);
            contentStream.showText("SalÃ¡rio LÃ­quido: R$ 911,00");
            contentStream.newLineAtOffset(0, -20);
            contentStream.showText("Data de Pagamento: 25/" + payslip.getMonth() + "/" + payslip.getYear());
            contentStream.endText();
            
            // Footer
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 10);
            contentStream.newLineAtOffset(50, 100);
            contentStream.showText("Documento gerado automaticamente pelo sistema SecuredGuard");
            contentStream.newLineAtOffset(0, -15);
            contentStream.showText("Data de geraÃ§Ã£o: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss")));
            contentStream.endText();
        }
    }

    /**
     * Adiciona pÃ¡gina do recibo ao documento unificado
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
            contentStream.showText("ITAÃš");
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 18);
            contentStream.newLineAtOffset(200, 0);
            contentStream.showText("30 HORAS");
            contentStream.endText();
            
            // Linha separadora
            contentStream.setLineWidth(1);
            contentStream.moveTo(50, 740);
            contentStream.lineTo(550, 740);
            contentStream.stroke();
            
            // TÃTULO PRINCIPAL
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 16);
            contentStream.newLineAtOffset(50, 710);
            contentStream.showText("COMPROVANTE DE OPERAÃ‡ÃƒO");
            contentStream.endText();
            
            // Tipo de operaÃ§Ã£o
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 12);
            contentStream.newLineAtOffset(50, 690);
            contentStream.showText("TransferÃªncia de Conta Corrente para Conta Corrente");
            contentStream.endText();
            
            // IdentificaÃ§Ã£o no extrato
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 12);
            contentStream.newLineAtOffset(50, 670);
            contentStream.showText("IdentificaÃ§Ã£o no Extrato: SISPAG SALARIOS");
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
            contentStream.showText("AgÃªncia: 0925");
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
            contentStream.showText("AgÃªncia: 0925");
            contentStream.newLineAtOffset(0, -15);
            contentStream.showText("Conta: 98240 - 7");
            contentStream.newLineAtOffset(0, -15);
            contentStream.showText("Nome: " + cleanText(receipt.getEmployeeName()));
            contentStream.newLineAtOffset(0, -15);
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
            contentStream.showText("Valor: R$ " + receipt.getNetSalary().toString());
            contentStream.endText();
            
            // INFORMAÃ‡Ã•ES DO PAGADOR
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 11);
            contentStream.newLineAtOffset(50, 450);
            contentStream.showText("InformaÃ§Ãµes fornecidas pelo pagador:");
            contentStream.endText();
            
            // DETALHES DA TRANSFERÃŠNCIA
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 11);
            contentStream.newLineAtOffset(50, 410);
            contentStream.showText("TransferÃªncia realizada via Sispag");
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
            
            // InformaÃ§Ãµes do sistema
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 8);
            contentStream.newLineAtOffset(50, 50);
            contentStream.showText("Documento unificado gerado automaticamente pelo sistema SecuredGuard");
            contentStream.newLineAtOffset(0, -12);
            contentStream.showText("Data de geraÃ§Ã£o: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss")));
            contentStream.endText();
        }
    }

    /**
     * Adiciona pÃ¡gina de verificaÃ§Ã£o e resultados da unificaÃ§Ã£o
     */
    private void addVerificationPage(PDDocument document, Payslip payslip, PaymentReceipt receipt, boolean namesMatch) throws IOException {
        PDPage page = new PDPage();
        document.addPage(page);
        
        try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
            contentStream.setNonStrokingColor(0, 0, 0); // Preto
            
            // HEADER - TÃ­tulo da pÃ¡gina
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 18);
            contentStream.newLineAtOffset(50, 750);
            contentStream.showText("RESULTADOS DA UNIFICAÃ‡ÃƒO");
            contentStream.endText();
            
            // Linha separadora
            contentStream.setLineWidth(1);
            contentStream.moveTo(50, 740);
            contentStream.lineTo(550, 740);
            contentStream.stroke();
            
            // TÃTULO PRINCIPAL
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 16);
            contentStream.newLineAtOffset(50, 710);
            contentStream.showText("Resumo da UnificaÃ§Ã£o");
            contentStream.endText();
            
            // InformaÃ§Ãµes do funcionÃ¡rio
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 12);
            contentStream.newLineAtOffset(50, 670);
            contentStream.showText("FuncionÃ¡rio: " + cleanText(payslip.getEmployeeName()));
            contentStream.newLineAtOffset(0, -20);
            contentStream.showText("MÃªs/Ano: " + payslip.getMonth() + "/" + payslip.getYear());
            contentStream.newLineAtOffset(0, -20);
            contentStream.showText("Recibo: " + cleanText(receipt.getFileName()));
            contentStream.endText();
            
            // Resultado da verificaÃ§Ã£o de nomes
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 14);
            contentStream.newLineAtOffset(50, 630);
            contentStream.showText("Resultado da VerificaÃ§Ã£o de Nomes:");
            contentStream.endText();
            
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 12);
            contentStream.newLineAtOffset(50, 600);
            contentStream.showText("Nomes Coincidentes: " + (namesMatch ? "SIM" : "NAO"));
            contentStream.endText();
            
            // Footer
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 10);
            contentStream.newLineAtOffset(50, 100);
            contentStream.showText("Documento gerado automaticamente pelo sistema SecuredGuard");
            contentStream.newLineAtOffset(0, -15);
            contentStream.showText("Data de geraÃ§Ã£o: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss")));
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
     * Busca holerite e recibo por funcionÃ¡rio e mÃªs/ano
     */
    public String createUnifiedDocumentForEmployee(String employeeName, int month, int year) throws IOException {
        log.info("ðŸ” UnificaÃ§Ã£o por nome/mÃªs/ano: {} - {}/{}", employeeName, month, year);

        final String cleanEmployeeName = cleanText(employeeName);
        log.info("ðŸ§¹ Nome normalizado: '{}' -> '{}'", employeeName, cleanEmployeeName);

        // 1) Localizar PDF original do holerite - PRIMEIRO BUSCAR NO BANCO DE DADOS
        String holeritePath = null;
        
        // Buscar holerites no banco de dados para o perÃ­odo
        List<Payslip> payslipsInDb = payslipService.getAllPayslips().stream()
            .filter(p -> p.getMonth() != null && p.getMonth().equals(month))
            .filter(p -> p.getYear() != null && p.getYear().equals(year))
            .collect(java.util.stream.Collectors.toList());
        
        log.info("ðŸ“Š Holerites encontrados no banco para {}/{}: {}", month, year, payslipsInDb.size());
        
        // Buscar holerite no banco pelo nome (flexÃ­vel)
        Payslip matchingPayslip = null;
        String normalizedSearchNameHolerite = normalizeNameForSearch(cleanEmployeeName);
        
        log.info("ðŸ” Buscando holerite com nome normalizado: '{}' (original: '{}')", normalizedSearchNameHolerite, cleanEmployeeName);
        log.info("ðŸ“Š Total de holerites no banco para {}/{}: {}", month, year, payslipsInDb.size());
        
        // Log de todos os holerites encontrados para debug
        if (!payslipsInDb.isEmpty()) {
            log.info("ðŸ“‹ Lista de holerites no banco para {}/{}:", month, year);
            for (Payslip p : payslipsInDb) {
                if (p.getEmployeeName() != null) {
                    String normalizedP = normalizeNameForSearch(p.getEmployeeName());
                    log.info("  â€¢ '{}' (normalizado: '{}')", p.getEmployeeName(), normalizedP);
                }
            }
        }
        
        for (Payslip payslip : payslipsInDb) {
            if (payslip.getEmployeeName() != null) {
                String normalizedPayslipName = normalizeNameForSearch(payslip.getEmployeeName());
                
                log.info("  ðŸ” Comparando: '{}' (payslip original: '{}') vs '{}' (search original: '{}')", 
                    normalizedPayslipName, payslip.getEmployeeName(), 
                    normalizedSearchNameHolerite, cleanEmployeeName);
                
                // Verificar se os nomes coincidem (flexÃ­vel)
                boolean exactMatch = normalizedPayslipName.equals(normalizedSearchNameHolerite);
                boolean containsMatch = normalizedPayslipName.contains(normalizedSearchNameHolerite) || 
                                       normalizedSearchNameHolerite.contains(normalizedPayslipName);
                boolean verifyMatch = verifyEmployeeNames(cleanEmployeeName, payslip.getEmployeeName());
                
                log.info("    Match exato: {}, Match por contenÃ§Ã£o: {}, Match por verifyEmployeeNames: {}", 
                    exactMatch, containsMatch, verifyMatch);
                
                if (exactMatch || containsMatch || verifyMatch) {
                    matchingPayslip = payslip;
                    log.info("âœ… Holerite encontrado no banco: {} - {}/{} (arquivoCaminho: {})", 
                        payslip.getEmployeeName(), payslip.getMonth(), payslip.getYear(),
                        payslip.getArquivoCaminho() != null ? payslip.getArquivoCaminho() : "N/A");
                    break;
                }
            } else {
                log.warn("  âš ï¸ Holerite sem nome de funcionÃ¡rio: {}/{}", payslip.getMonth(), payslip.getYear());
            }
        }
        
        if (matchingPayslip == null) {
            log.warn("âŒ Nenhum holerite encontrado no banco que corresponda ao nome '{}' (normalizado: '{}')", 
                cleanEmployeeName, normalizedSearchNameHolerite);
            log.warn("ðŸ“‹ Holerites disponÃ­veis no banco para {}/{}:", month, year);
            for (Payslip p : payslipsInDb) {
                if (p.getEmployeeName() != null) {
                    log.warn("  â€¢ '{}' (normalizado: '{}')", p.getEmployeeName(), normalizeNameForSearch(p.getEmployeeName()));
                }
            }
        }
        
        // Se encontrou no banco, usar o arquivoCaminho
        if (matchingPayslip != null && matchingPayslip.getArquivoCaminho() != null) {
            holeritePath = matchingPayslip.getArquivoCaminho();
            log.info("ðŸ” Tentando usar arquivoCaminho do banco: {}", holeritePath);
            
            // Tentar caminho absoluto primeiro
            Path absolutePath = Paths.get(holeritePath);
            if (Files.exists(absolutePath)) {
                log.info("âœ… Holerite encontrado via banco de dados (caminho absoluto): {}", absolutePath.toAbsolutePath());
                holeritePath = absolutePath.toAbsolutePath().toString();
            } else {
                // Tentar caminho relativo
                Path relativePath = Paths.get(System.getProperty("user.dir"), holeritePath);
                if (Files.exists(relativePath)) {
                    log.info("âœ… Holerite encontrado via banco de dados (caminho relativo): {}", relativePath.toAbsolutePath());
                    holeritePath = relativePath.toAbsolutePath().toString();
                } else {
                    log.warn("âš ï¸ Arquivo do holerite nÃ£o existe no caminho do banco:");
                    log.warn("  â€¢ Caminho absoluto testado: {}", absolutePath.toAbsolutePath());
                    log.warn("  â€¢ Caminho relativo testado: {}", relativePath.toAbsolutePath());
                    log.warn("  â€¢ Tentando buscar em outros locais...");
                    holeritePath = null; // Tentar buscar em outros locais
                }
            }
        }
        
        // Se nÃ£o encontrou no banco ou arquivo nÃ£o existe, buscar nos diretÃ³rios conhecidos
        if (holeritePath == null || !Files.exists(Paths.get(holeritePath))) {
            log.info("ðŸ” Buscando holerite nos diretÃ³rios conhecidos...");
            holeritePath = findHoleriteOriginalFileByNameAndPeriod(cleanEmployeeName, month, year);
        }
        
        // VerificaÃ§Ã£o final
        if (holeritePath == null || !Files.exists(Paths.get(holeritePath))) {
            log.error("âŒ Holerite nÃ£o encontrado para {} {}/{}", cleanEmployeeName, month, year);
            
            // Construir mensagem de erro detalhada
            StringBuilder errorDetails = new StringBuilder();
            errorDetails.append("âŒ HOLERITE NÃƒO ENCONTRADO\n\n");
            errorDetails.append("ðŸ“‹ DETALHES:\n");
            errorDetails.append(String.format("â€¢ FuncionÃ¡rio: %s\n", employeeName));
            errorDetails.append(String.format("â€¢ Nome normalizado para busca: %s\n", normalizedSearchNameHolerite));
            errorDetails.append(String.format("â€¢ PerÃ­odo: %d/%d\n\n", month, year));
            
            if (!payslipsInDb.isEmpty()) {
                errorDetails.append("ðŸ“Š HOLERITES ENCONTRADOS NO BANCO PARA ESTE PERÃODO:\n");
                for (Payslip p : payslipsInDb) {
                    String payslipNormalizedName = p.getEmployeeName() != null ? normalizeNameForSearch(p.getEmployeeName()) : "N/A";
                    errorDetails.append(String.format("  â€¢ %s (normalizado: %s) - %d/%d\n", 
                        p.getEmployeeName() != null ? p.getEmployeeName() : "N/A",
                        payslipNormalizedName,
                        p.getMonth(), p.getYear()));
                    if (p.getArquivoCaminho() != null) {
                        errorDetails.append(String.format("    arquivoCaminho: %s\n", p.getArquivoCaminho()));
                        Path testPath = Paths.get(p.getArquivoCaminho());
                        errorDetails.append(String.format("    Arquivo existe: %s\n", Files.exists(testPath) ? "SIM" : "NÃƒO"));
                    }
                }
                errorDetails.append("\n");
            } else {
                errorDetails.append("âš ï¸ Nenhum holerite encontrado no banco para o perÃ­odo ").append(month).append("/").append(year).append("\n\n");
            }
            
            errorDetails.append("ðŸ’¡ SOLUÃ‡ÃƒO:\n");
            errorDetails.append(String.format("1. Verifique se o holerite foi importado para '%s'\n", employeeName));
            errorDetails.append(String.format("2. O holerite deve ser do perÃ­odo %d/%d\n", month, year));
            errorDetails.append("3. Verifique se o nome do funcionÃ¡rio estÃ¡ correto no holerite\n");
            errorDetails.append("4. Se o holerite foi importado, verifique se o arquivo PDF existe no servidor\n");
            
            throw new IOException(errorDetails.toString());
        }
        log.info("ðŸ“„ Holerite encontrado: {}", holeritePath);

        // 2) Localizar PDF original do comprovante (REGRA: mÃªs seguinte ao holerite)
        int receiptMonth = month == 12 ? 1 : month + 1;
        int receiptYear = month == 12 ? year + 1 : year;
        
        log.info("ðŸ” Buscando comprovante para holerite {}/{} -> comprovante {}/{}", 
            month, year, receiptMonth, receiptYear);
        
        // ESTRATÃ‰GIA MELHORADA: Primeiro buscar no banco de dados, depois nos arquivos
        String receiptPath = null;
        List<PaymentReceipt> receiptsInDb = receiptRepository.findByYearAndMonth(receiptYear, receiptMonth);
        
        log.info("ðŸ“Š Comprovantes encontrados no banco para {}/{}: {}", receiptMonth, receiptYear, receiptsInDb.size());
        
        // Log detalhado de todos os comprovantes encontrados
        if (!receiptsInDb.isEmpty()) {
            log.info("ðŸ“‹ Lista de comprovantes no banco para {}/{}:", receiptMonth, receiptYear);
            for (PaymentReceipt r : receiptsInDb) {
                log.info("  â€¢ {} - {}/{} (filePath: {})", 
                    r.getEmployeeName() != null ? r.getEmployeeName() : "N/A",
                    r.getMonth(), r.getYear(),
                    r.getFilePath() != null ? r.getFilePath() : "N/A");
            }
        }
        
        // Buscar comprovante no banco usando o nome da conta creditada e verificando no PDF do holerite
        PaymentReceipt matchingReceipt = null;
        String normalizedSearchName = normalizeNameForSearch(cleanEmployeeName);
        
        log.info("ðŸ” Buscando comprovante usando nome da conta creditada e verificaÃ§Ã£o no PDF do holerite");
        log.info("ðŸ“ Nome do funcionÃ¡rio (holerite): '{}' (normalizado: '{}')", cleanEmployeeName, normalizedSearchName);
        
        // NOVA ESTRATÃ‰GIA: Verificar cada comprovante usando o nome da conta creditada e o PDF do holerite
        for (PaymentReceipt receipt : receiptsInDb) {
            if (receipt.getEmployeeName() == null && receipt.getCreditedName() == null) {
                log.warn("  âš ï¸ Comprovante sem nome de funcionÃ¡rio nem conta creditada: {}/{}", receipt.getMonth(), receipt.getYear());
                continue;
            }
            
            // Usar o nome da conta creditada (que pode estar abreviado) ou o nome do funcionÃ¡rio
            String receiptName = receipt.getCreditedName() != null ? receipt.getCreditedName() : receipt.getEmployeeName();
            
            log.info("  ðŸ” Verificando comprovante: '{}' (conta creditada: '{}')", 
                receipt.getEmployeeName(), receipt.getCreditedName());
            
            // Verificar no PDF do holerite se o nome do comprovante aparece na mesma linha do cÃ³digo e CPF
            if (matchingPayslip != null && matchingPayslip.getArquivoCaminho() != null) {
                Payslip matchedPayslip = findPayslipByReceiptNameInPDF(receiptName, List.of(matchingPayslip));
                
                if (matchedPayslip != null) {
                    matchingReceipt = receipt;
                    log.info("âœ… Comprovante encontrado! '{}' corresponde ao holerite '{}' (verificado no PDF)", 
                        receiptName, matchingPayslip.getEmployeeName());
                    break;
                }
            }
            
            // Fallback: verificar usando estratÃ©gias tradicionais de matching
            if (receipt.getEmployeeName() != null) {
                String normalizedReceiptName = normalizeNameForSearch(receipt.getEmployeeName());
                
                log.info("  ðŸ” Comparando (fallback): '{}' (receipt) vs '{}' (search)", normalizedReceiptName, normalizedSearchName);
                
                boolean exactMatch = normalizedReceiptName.equals(normalizedSearchName);
                boolean containsMatch = normalizedReceiptName.contains(normalizedSearchName) || 
                                       normalizedSearchName.contains(normalizedReceiptName);
                boolean verifyMatch = verifyEmployeeNames(cleanEmployeeName, receipt.getEmployeeName());
                
                log.info("    Match exato: {}, Match por contenÃ§Ã£o: {}, Match por verifyEmployeeNames: {}", 
                    exactMatch, containsMatch, verifyMatch);
                
                if (exactMatch || containsMatch || verifyMatch) {
                    matchingReceipt = receipt;
                    log.info("âœ… Comprovante encontrado no banco (fallback): {} - {}/{} (filePath: {})", 
                        receipt.getEmployeeName(), receipt.getMonth(), receipt.getYear(),
                        receipt.getFilePath() != null ? receipt.getFilePath() : "N/A");
                    break;
                }
            }
        }
        
        if (matchingReceipt == null) {
            log.warn("âŒ Nenhum comprovante encontrado no banco que corresponda ao nome '{}'", cleanEmployeeName);
        }
        
        // Se encontrou no banco, usar o filePath
        if (matchingReceipt != null && matchingReceipt.getFilePath() != null) {
            receiptPath = matchingReceipt.getFilePath();
            log.info("ðŸ” Tentando usar filePath do banco: {}", receiptPath);
            
            // Tentar caminho absoluto primeiro
            Path absolutePath = Paths.get(receiptPath);
            if (Files.exists(absolutePath)) {
                log.info("âœ… Comprovante encontrado via banco de dados (caminho absoluto): {}", absolutePath.toAbsolutePath());
                receiptPath = absolutePath.toAbsolutePath().toString();
            } else {
                // Tentar caminho relativo
                Path relativePath = Paths.get(System.getProperty("user.dir"), receiptPath);
                if (Files.exists(relativePath)) {
                    log.info("âœ… Comprovante encontrado via banco de dados (caminho relativo): {}", relativePath.toAbsolutePath());
                    receiptPath = relativePath.toAbsolutePath().toString();
                } else {
                    log.warn("âš ï¸ Arquivo do comprovante nÃ£o existe no caminho do banco:");
                    log.warn("  â€¢ Caminho absoluto testado: {}", absolutePath.toAbsolutePath());
                    log.warn("  â€¢ Caminho relativo testado: {}", relativePath.toAbsolutePath());
                    log.warn("  â€¢ Tentando buscar em outros locais...");
                    receiptPath = null; // Tentar buscar em outros locais
                }
            }
        }
        
        // Se nÃ£o encontrou no banco ou arquivo nÃ£o existe, buscar nos diretÃ³rios conhecidos
        if (receiptPath == null || !Files.exists(Paths.get(receiptPath))) {
            log.info("ðŸ” Buscando comprovante nos diretÃ³rios conhecidos...");
            receiptPath = findReceiptOriginalFileByNameAndPeriod(cleanEmployeeName, receiptMonth, receiptYear);
        }
        
        // Se ainda nÃ£o encontrou, tentar buscar apenas pelo nome (sem perÃ­odo)
        if (receiptPath == null || !Files.exists(Paths.get(receiptPath))) {
            log.info("ðŸ” Tentando buscar comprovante apenas pelo nome (sem perÃ­odo)...");
            java.util.List<String> searchedPaths = new java.util.ArrayList<>();
            receiptPath = findReceiptOriginalFileByNameOnly(cleanEmployeeName, searchedPaths);
        }
        
            // VerificaÃ§Ã£o final
        if (receiptPath == null || !Files.exists(Paths.get(receiptPath))) {
            log.error("âŒ Comprovante nÃ£o encontrado para {} {}/{} (holerite {}/{})", 
                cleanEmployeeName, receiptMonth, receiptYear, month, year);
            
            // Construir mensagem de erro mais clara e Ãºtil
            StringBuilder errorDetails = new StringBuilder();
            errorDetails.append("âŒ COMPROVANTE NÃƒO ENCONTRADO\n\n");
            errorDetails.append("ðŸ“‹ DETALHES:\n");
            errorDetails.append(String.format("â€¢ FuncionÃ¡rio: %s\n", employeeName));
            errorDetails.append(String.format("â€¢ Nome normalizado para busca: %s\n", normalizedSearchName));
            errorDetails.append(String.format("â€¢ Holerite: %d/%d (jÃ¡ importado âœ“)\n", month, year));
            errorDetails.append(String.format("â€¢ Comprovante esperado: %d/%d (mÃªs seguinte ao holerite)\n\n", receiptMonth, receiptYear));
            
            // Adicionar informaÃ§Ãµes sobre o que foi encontrado no banco
            if (!receiptsInDb.isEmpty()) {
                errorDetails.append("ðŸ“Š COMPROVANTES ENCONTRADOS NO BANCO PARA ESTE PERÃODO:\n");
                for (PaymentReceipt r : receiptsInDb) {
                    String receiptNormalizedName = r.getEmployeeName() != null ? normalizeNameForSearch(r.getEmployeeName()) : "N/A";
                    errorDetails.append(String.format("  â€¢ %s (normalizado: %s) - %d/%d\n", 
                        r.getEmployeeName() != null ? r.getEmployeeName() : "N/A",
                        receiptNormalizedName,
                        r.getMonth(), r.getYear()));
                    if (r.getFilePath() != null) {
                        errorDetails.append(String.format("    filePath: %s\n", r.getFilePath()));
                        Path testPath = Paths.get(r.getFilePath());
                        errorDetails.append(String.format("    Arquivo existe: %s\n", Files.exists(testPath) ? "SIM" : "NÃƒO"));
                    }
                }
                errorDetails.append("\n");
                
                // Adicionar informaÃ§Ãµes sobre por que nÃ£o houve match
                errorDetails.append("ðŸ” ANÃLISE DE MATCH:\n");
                errorDetails.append(String.format("Nome buscado (normalizado): '%s'\n", normalizedSearchName));
                for (PaymentReceipt r : receiptsInDb) {
                    if (r.getEmployeeName() != null) {
                        String rNormalized = normalizeNameForSearch(r.getEmployeeName());
                        boolean exact = rNormalized.equals(normalizedSearchName);
                        boolean contains = rNormalized.contains(normalizedSearchName) || normalizedSearchName.contains(rNormalized);
                        boolean verify = verifyEmployeeNames(cleanEmployeeName, r.getEmployeeName());
                        errorDetails.append(String.format("  â€¢ '%s' -> Match exato: %s, Match contenÃ§Ã£o: %s, Match verify: %s\n", 
                            r.getEmployeeName(), exact, contains, verify));
                    }
                }
                errorDetails.append("\n");
            } else {
                errorDetails.append("âš ï¸ Nenhum comprovante encontrado no banco para o perÃ­odo ").append(receiptMonth).append("/").append(receiptYear).append("\n\n");
            }
            
            errorDetails.append("ðŸ’¡ SOLUÃ‡ÃƒO:\n");
            errorDetails.append(String.format("1. Verifique se o comprovante de pagamento foi importado para '%s'\n", employeeName));
            errorDetails.append(String.format("2. O comprovante deve ser do perÃ­odo %d/%d (mÃªs seguinte ao holerite)\n", receiptMonth, receiptYear));
            errorDetails.append("3. Verifique se o nome do funcionÃ¡rio estÃ¡ correto no comprovante\n");
            errorDetails.append("4. Se o comprovante foi importado, verifique se o arquivo PDF existe no servidor\n");
            
            throw new IOException(errorDetails.toString());
        }
        log.info("ðŸ“„ Comprovante encontrado: {}", receiptPath);

        // 3) Verificar nomes (flexÃ­vel) antes de unificar
        boolean namesOk = verifyEmployeeNames(cleanEmployeeName, cleanEmployeeName);
        if (!namesOk) {
            log.warn("âš ï¸ Nomes nÃ£o coincidem (verificaÃ§Ã£o flexÃ­vel) - prosseguindo mesmo assim");
        }

        // 4) Extrair nome do funcionÃ¡rio do holerite e do comprovante e verificar correspondÃªncia
        String employeeNameFromPayslip = null;
        String employeeNameFromReceipt = null;
        
        // Extrair nome do holerite (do PDF ou do objeto)
        if (matchingPayslip != null && matchingPayslip.getEmployeeName() != null) {
            employeeNameFromPayslip = matchingPayslip.getEmployeeName();
            log.info("ðŸ“ Nome do funcionÃ¡rio extraÃ­do do holerite: '{}'", employeeNameFromPayslip);
        } else {
            // Tentar extrair do PDF do holerite
            try {
                employeeNameFromPayslip = extractEmployeeNameFromPayslipPDF(holeritePath);
                log.info("ðŸ“ Nome do funcionÃ¡rio extraÃ­do do PDF do holerite: '{}'", employeeNameFromPayslip);
            } catch (Exception e) {
                log.warn("âš ï¸ NÃ£o foi possÃ­vel extrair nome do PDF do holerite: {}", e.getMessage());
            }
        }
        
        // Extrair nome do comprovante (do PDF ou do objeto)
        if (matchingReceipt != null) {
            // Priorizar o nome da conta creditada (que pode estar abreviado)
            employeeNameFromReceipt = matchingReceipt.getCreditedName() != null ? 
                matchingReceipt.getCreditedName() : matchingReceipt.getEmployeeName();
            log.info("ðŸ“ Nome do funcionÃ¡rio extraÃ­do do comprovante: '{}' (conta creditada: '{}')", 
                employeeNameFromReceipt, matchingReceipt.getCreditedName());
        } else {
            // Tentar extrair do PDF do comprovante
            try {
                employeeNameFromReceipt = extractEmployeeNameFromReceiptPDF(receiptPath);
                log.info("ðŸ“ Nome do funcionÃ¡rio extraÃ­do do PDF do comprovante: '{}'", employeeNameFromReceipt);
            } catch (Exception e) {
                log.warn("âš ï¸ NÃ£o foi possÃ­vel extrair nome do PDF do comprovante: {}", e.getMessage());
            }
        }
        
        // Verificar se os nomes correspondem usando as regras de abreviaÃ§Ã£o
        String finalEmployeeName = cleanEmployeeName; // Fallback para o nome original
        if (employeeNameFromPayslip != null && employeeNameFromReceipt != null) {
            boolean namesMatch = verifyEmployeeNames(employeeNameFromPayslip, employeeNameFromReceipt);
            log.info("ðŸ” VerificaÃ§Ã£o de nomes: '{}' (holerite) vs '{}' (comprovante) = {}", 
                employeeNameFromPayslip, employeeNameFromReceipt, namesMatch ? "âœ… MATCH" : "âŒ NO MATCH");
            
            if (namesMatch) {
                // Usar o nome do holerite (que Ã© o completo) para salvar o arquivo
                finalEmployeeName = employeeNameFromPayslip;
                log.info("âœ… Nomes correspondem! Usando nome do holerite para salvar arquivo: '{}'", finalEmployeeName);
            } else {
                log.warn("âš ï¸ Nomes nÃ£o correspondem! Usando nome original: '{}'", finalEmployeeName);
            }
        } else if (employeeNameFromPayslip != null) {
            // Se sÃ³ temos o nome do holerite, usar ele
            finalEmployeeName = employeeNameFromPayslip;
            log.info("âœ… Usando nome do holerite para salvar arquivo: '{}'", finalEmployeeName);
        } else if (employeeNameFromReceipt != null) {
            // Se sÃ³ temos o nome do comprovante, tentar encontrar o nome completo no holerite
            log.warn("âš ï¸ Apenas nome do comprovante disponÃ­vel. Tentando encontrar nome completo no holerite...");
            // Usar o nome original como fallback
        }
        
        // 5) Unificar mantendo holerite na pÃ¡gina 1 e comprovante na pÃ¡gina 2
        log.info("ðŸ”„ Criando documento unificado individual com nome do funcionÃ¡rio: '{}'", finalEmployeeName);
        List<String> receiptPaths = new ArrayList<>();
        receiptPaths.add(receiptPath);
        
        String unifiedPath = createUnifiedPdfUsingMerger(
            holeritePath, 
            receiptPaths, 
            finalEmployeeName, // Usar o nome verificado
            month, 
            year,
            matchingPayslip, // Passar o payslip para extrair informaÃ§Ãµes adicionais
            matchingReceipt  // Passar o receipt para extrair informaÃ§Ãµes adicionais
        );

        log.info("âœ… Documento unificado criado: {}", unifiedPath);
        return unifiedPath;
    }

    /**
     * Procura o arquivo PDF do holerite por nome e perÃ­odo em locais conhecidos
     */
    private String findHoleriteOriginalFileByNameAndPeriod(String employeeName, int month, int year) {
        try {
            log.info("ðŸ” Procurando holerite para: {} - {}/{}", employeeName, month, year);
            
            // Candidatos de diretÃ³rios conhecidos (baseado em PayslipService OUTPUT_DIR)
            java.util.List<Path> candidates = java.util.List.of(
                Paths.get("backend", "holerites", month + "-" + year),              // PadrÃ£o principal
                Paths.get("backend", "holerites", String.format("%d-%d", month, year)),
                Paths.get("uploads", "holerites", String.format("%02d_%d", month, year)),
                Paths.get("uploads", "holerites_processados", String.format("%02d_%d", month, year)),
                Paths.get("uploads", "payslips"),
                Paths.get("backend", "payslips_output")
            );

            // Normalizar nome para busca - remover caracteres especiais e underscores
            String nameToken = employeeName
                .replaceAll("[^a-zA-ZÃ€-Ã¿0-9\\s]", "")
                .replaceAll("\\s+", "_")
                .toUpperCase();
            
            log.info("ðŸ” Token de busca do nome: {}", nameToken);

            for (Path base : candidates) {
                if (!Files.exists(base)) {
                    log.debug("â­ï¸ DiretÃ³rio nÃ£o existe: {}", base);
                    continue;
                }
                
                log.info("ðŸ“‚ Procurando em: {}", base.toAbsolutePath());
                
                try (var stream = Files.walk(base, 2)) {  // Limitar profundidade para performance
                    var match = stream
                        .filter(Files::isRegularFile)
                        .filter(p -> p.toString().toLowerCase().endsWith(".pdf"))
                        .filter(p -> {
                            String fileName = p.getFileName().toString().toUpperCase();
                            boolean nameMatch = fileName.contains(nameToken);
                            // Aceitar tanto formato "_9_2025" quanto "9_2025" e variaÃ§Ãµes
                            boolean periodMatch = fileName.contains("_" + month + "_" + year) ||
                                                fileName.contains(month + "_" + year) ||
                                                fileName.contains("_" + month + "_" + year + ".PDF") ||
                                                fileName.contains(month + "_" + year + ".PDF");
                            
                            if (nameMatch && periodMatch) {
                                log.info("âœ… Arquivo encontrado: {}", p);
                            }
                            
                            return nameMatch && periodMatch;
                        })
                        .map(Path::toString)
                        .findFirst();
                    
                    if (match.isPresent()) {
                        log.info("âœ… Holerite encontrado: {}", match.get());
                        return match.get();
                    }
                }
            }
            
            log.warn("âŒ Holerite nÃ£o encontrado para {} - {}/{}", employeeName, month, year);
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao procurar holerite: {}", e.getMessage(), e);
        }
        return null;
    }

    /**
     * Procura o arquivo PDF do comprovante por nome e perÃ­odo em locais conhecidos
     */
    private String findReceiptOriginalFileByNameAndPeriod(String employeeName, int month, int year) {
        return findReceiptOriginalFileByNameAndPeriod(employeeName, month, year, null);
    }
    
    /**
     * Busca comprovante apenas pelo nome do funcionÃ¡rio, sem perÃ­odo
     */
    private String findReceiptOriginalFileByNameOnly(String employeeName, java.util.List<String> searchedPaths) {
        try {
            log.info("ðŸ” Procurando comprovante apenas pelo nome: {}", employeeName);
            
            // Candidatos de diretÃ³rios conhecidos (buscar em todas as pastas possÃ­veis)
            java.util.List<Path> candidates = java.util.List.of(
                Paths.get("uploads", "receipts"),  // Raiz
                Paths.get("uploads", "payment-receipts")  // Alternativa
            );
            
            // Normalizar nome para busca
            String nameTokenLower = employeeName
                .replaceAll("[^a-zA-ZÃ€-Ã¿0-9\\s]", "")
                .replaceAll("\\s+", "_")
                .toLowerCase();
            
            String nameTokenUpper = nameTokenLower.toUpperCase();
            
            for (Path base : candidates) {
                Path absoluteBase = base.toAbsolutePath();
                String pathStr = absoluteBase.toString();
                
                if (searchedPaths != null) {
                    searchedPaths.add(pathStr);
                }
                
                if (!Files.exists(base)) {
                    log.debug("â­ï¸ DiretÃ³rio nÃ£o existe: {}", absoluteBase);
                    continue;
                }
                
                log.info("ðŸ“‚ Procurando em: {}", absoluteBase);
                
                try (var stream = Files.walk(base, 3)) {  // Buscar recursivamente atÃ© 3 nÃ­veis
                    var match = stream
                        .filter(Files::isRegularFile)
                        .filter(p -> p.toString().toLowerCase().endsWith(".pdf"))
                        .filter(p -> {
                            String fileName = p.getFileName().toString();
                            String fileNameLower = fileName.toLowerCase();
                            String fileNameUpper = fileName.toUpperCase();
                            
                            // Buscar apenas por nome (case insensitive)
                            return fileNameLower.contains(nameTokenLower) || 
                                   fileNameUpper.contains(nameTokenUpper);
                        })
                        .map(Path::toString)
                        .findFirst();
                    
                    if (match.isPresent()) {
                        log.info("âœ… Comprovante encontrado (apenas por nome): {}", match.get());
                        return match.get();
                    }
                }
            }
            
            log.warn("âŒ Comprovante nÃ£o encontrado apenas pelo nome: {}", employeeName);
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao procurar comprovante apenas por nome: {}", e.getMessage(), e);
        }
        return null;
    }
    
    private String findReceiptOriginalFileByNameAndPeriod(String employeeName, int month, int year, java.util.List<String> searchedPaths) {
        try {
            log.info("ðŸ” Procurando comprovante para: {} - {}/{}", employeeName, month, year);
            
            // Candidatos de diretÃ³rios conhecidos (baseado em ReceiptProcessingService UPLOAD_DIR)
            // ADICIONADAS MAIS PASTAS PARA AUMENTAR A EFICIÃŠNCIA
            java.util.List<Path> candidates = java.util.List.of(
                Paths.get("uploads", "receipts", String.format("%02d_%04d", month, year)),  // PadrÃ£o principal: 10_2025
                Paths.get("uploads", "receipts", String.format("%d_%d", month, year)),      // Sem zero: 10_2025
                Paths.get("uploads", "receipts", String.format("%02d/%04d", month, year)),  // Com barra: 10/2025
                Paths.get("uploads", "receipts", String.format("%d/%d", month, year)),      // Sem zero com barra
                Paths.get("uploads", "payment-receipts", String.valueOf(year), String.format("%02d", month)), // YYYY/MM
                Paths.get("uploads", "payment-receipts", String.valueOf(year), String.valueOf(month)),       // YYYY/M
                Paths.get("uploads", "payment-receipts", String.format("%04d", year), String.format("%02d", month)), // YYYY/MM (com zeros)
                Paths.get("uploads", "receipts")  // Raiz (Ãºltima tentativa)
            );

            // Normalizar nome para busca - lowercase com underscores
            String nameTokenLower = employeeName
                .replaceAll("[^a-zA-ZÃ€-Ã¿0-9\\s]", "")
                .replaceAll("\\s+", "_")
                .toLowerCase();
            
            String nameTokenUpper = nameTokenLower.toUpperCase();
            
            log.info("ðŸ” Tokens de busca: lower='{}', upper='{}'", nameTokenLower, nameTokenUpper);
            
            java.util.List<String> pathsChecked = new java.util.ArrayList<>();

            for (Path base : candidates) {
                Path absoluteBase = base.toAbsolutePath();
                String pathStr = absoluteBase.toString();
                pathsChecked.add(pathStr);
                
                if (searchedPaths != null) {
                    searchedPaths.add(pathStr);
                }
                
                if (!Files.exists(base)) {
                    log.debug("â­ï¸ DiretÃ³rio nÃ£o existe: {}", absoluteBase);
                    continue;
                }
                
                log.info("ðŸ“‚ Procurando em: {}", absoluteBase);
                
                try (var stream = Files.walk(base, 2)) {  // Limitar profundidade
                    var match = stream
                        .filter(Files::isRegularFile)
                        .filter(p -> p.toString().toLowerCase().endsWith(".pdf"))
                        .filter(p -> {
                            String fileName = p.getFileName().toString();
                            String fileNameLower = fileName.toLowerCase();
                            String fileNameUpper = fileName.toUpperCase();
                            
                            // Buscar por nome (case insensitive) e perÃ­odo
                            boolean nameMatch = fileNameLower.contains(nameTokenLower) || 
                                              fileNameUpper.contains(nameTokenUpper);
                            
                            // Aceitar diferentes formatos de perÃ­odo: _9_2025, _09_2025, 9_2025, etc
                            boolean periodMatch = fileNameLower.contains("_" + month + "_" + year) ||
                                                fileNameLower.contains("_" + String.format("%02d", month) + "_" + year) ||
                                                fileNameLower.contains(month + "_" + year) ||
                                                fileNameLower.contains(String.format("%02d", month) + "_" + year) ||
                                                fileNameLower.contains("_" + year + "_" + month) ||
                                                fileNameLower.contains("_" + year + "_" + String.format("%02d", month));
                            
                            if (nameMatch && periodMatch) {
                                log.info("âœ… Arquivo encontrado: {}", p);
                            }
                            
                            return nameMatch && periodMatch;
                        })
                        .map(Path::toString)
                        .findFirst();
                    
                    if (match.isPresent()) {
                        log.info("âœ… Comprovante encontrado: {}", match.get());
                        return match.get();
                    }
                }
            }
            
            log.warn("âŒ Comprovante nÃ£o encontrado para {} - {}/{} nas pastas: {}", 
                employeeName, month, year, String.join(", ", pathsChecked));
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao procurar comprovante: {}", e.getMessage(), e);
        }
        return null;
    }

    /**
     * Cria holerite mock para teste
     */
    private Payslip createMockPayslip(String employeeName, int month, int year) {
        try {
            log.info("ðŸ—ï¸ Criando Payslip mock para: {} - {}/{}", employeeName, month, year);
            
            // Usar o builder do Payslip para criar um mock
            return Payslip.builder()
                .employeeName(employeeName)
                .cpf("123.456.789-00")
                .month(month)
                .year(year)
                .fileName("holerite_" + employeeName.toLowerCase().replaceAll("\\s+", "_") + "_" + month + "_" + year + ".pdf")
                .build();
                
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao criar Payslip mock: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Cria recibo mock para teste
     */
    private PaymentReceipt createMockReceipt(String employeeName, int month, int year) {
        try {
            log.info("ðŸ—ï¸ Criando PaymentReceipt mock para: {} - {}/{}", employeeName, month, year);
            
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
            log.error("ðŸ’¥ Erro ao criar PaymentReceipt mock: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Lista todos os documentos unificados disponÃ­veis
     */
    public List<Map<String, Object>> listAllUnifiedDocuments() throws IOException {
        log.info("ðŸ“‹ Listando todos os documentos unificados...");
        
        List<Map<String, Object>> documents = new ArrayList<>();
        
        try {
            // Listar arquivos da pasta unificada principal
            Path unifiedPath = Paths.get(UNIFIED_DIR).toAbsolutePath();
            if (!Files.exists(unifiedPath)) {
                log.warn("âš ï¸ Pasta unificada nÃ£o existe: {}", unifiedPath);
                Files.createDirectories(unifiedPath);
                // NÃ£o retornar vazio imediatamente - tentar buscar tambÃ©m no banco de dados
                log.info("ðŸ“‹ Pasta nÃ£o existe, buscando documentos unificados no banco de dados...");
            } else {
                log.info("ðŸ“‚ Buscando em: {}", unifiedPath);
            }
            
            // ESTRATÃ‰GIA 1: Buscar arquivos fÃ­sicos na pasta
            if (Files.exists(unifiedPath)) {
                // Buscar recursivamente em todos os subdiretÃ³rios (aumentar profundidade para 5 nÃ­veis)
                Files.walk(unifiedPath, 5)  // Profundidade mÃ¡xima de 5 nÃ­veis
                    .filter(Files::isRegularFile)
                    .filter(path -> path.toString().toLowerCase().endsWith(".pdf"))
                    .forEach(path -> {
                    try {
                        String fileName = path.getFileName().toString();
                        Map<String, Object> doc = new HashMap<>();
                        
                        // Determinar tipo baseado no nome do arquivo ou diretÃ³rio pai
                        String parentDir = path.getParent().getFileName().toString().toLowerCase();
                        String type = "UNIFICADO";
                        if (fileName.toLowerCase().contains("holerite") || parentDir.contains("holerite")) {
                            type = "HOLERITE";
                        } else if (fileName.toLowerCase().contains("recibo") || parentDir.contains("recibo") || parentDir.contains("receipt")) {
                            type = "RECIBO";
                        } else if (fileName.toLowerCase().contains("unificado") || fileName.toLowerCase().contains("unified")) {
                            type = "UNIFICADO";
                        }
                        
                        doc.put("type", type);
                        doc.put("fileName", fileName);
                        doc.put("filePath", path.toString());
                        doc.put("fileSize", getFileSize(path));
                        doc.put("createdAt", getFileCreationTime(path));
                        
                        // Extrair informaÃ§Ãµes do nome do arquivo
                        String employeeName = extractEmployeeNameFromFileName(fileName);
                        doc.put("employeeName", employeeName);
                        
                        // Tentar extrair CPF do nome do arquivo (padrÃ£o: NOME_CPF_MES_ANO)
                        java.util.regex.Pattern cpfPattern = java.util.regex.Pattern.compile("(\\d{11})");
                        java.util.regex.Matcher cpfMatcher = cpfPattern.matcher(fileName);
                        if (cpfMatcher.find()) {
                            String cpf = cpfMatcher.group(1);
                            doc.put("cpf", cpf);
                            log.debug("ðŸ“„ CPF extraÃ­do do arquivo: {}", cpf);
                        }
                        
                        // Tentar extrair mÃªs e ano do nome do arquivo
                        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("_(\\d{1,2})_(\\d{4})");
                        java.util.regex.Matcher matcher = pattern.matcher(fileName);
                        if (matcher.find()) {
                            doc.put("month", Integer.parseInt(matcher.group(1)));
                            doc.put("year", Integer.parseInt(matcher.group(2)));
                        }
                        
                        documents.add(doc);
                        log.debug("ðŸ“„ Adicionado: {} - {}", type, fileName);
                    } catch (Exception e) {
                        log.warn("âš ï¸ Erro ao processar arquivo {}: {}", path, e.getMessage());
                    }
                });
            }
            
            // ESTRATÃ‰GIA 2: Buscar tambÃ©m no banco de dados (UnifiedDocument)
            try {
                List<UnifiedDocument> unifiedDocsFromDb = unifiedDocumentRepository.findAll();
                log.info("ðŸ“‹ Encontrados {} documentos unificados no banco de dados", unifiedDocsFromDb.size());
                
                for (UnifiedDocument ud : unifiedDocsFromDb) {
                    // Verificar se jÃ¡ nÃ£o foi adicionado pela busca de arquivos
                    boolean alreadyAdded = documents.stream()
                        .anyMatch(doc -> {
                            String docFileName = (String) doc.get("fileName");
                            String docEmployeeName = (String) doc.get("employeeName");
                            Integer docMonth = (Integer) doc.get("month");
                            Integer docYear = (Integer) doc.get("year");
                            
                            return (docFileName != null && ud.getFilePath() != null && ud.getFilePath().contains(docFileName)) ||
                                   (docEmployeeName != null && ud.getEmployeeName() != null && 
                                    docEmployeeName.equals(ud.getEmployeeName()) &&
                                    docMonth != null && docYear != null &&
                                    docMonth.equals(ud.getMonth()) && docYear.equals(ud.getYear()));
                        });
                    
                    if (!alreadyAdded && ud.getFilePath() != null && Files.exists(Paths.get(ud.getFilePath()))) {
                        Map<String, Object> doc = new HashMap<>();
                        doc.put("type", "UNIFICADO");
                        doc.put("fileName", ud.getFilePath().substring(ud.getFilePath().lastIndexOf(java.io.File.separator) + 1));
                        doc.put("filePath", ud.getFilePath());
                        doc.put("fileSize", getFileSize(Paths.get(ud.getFilePath())));
                        doc.put("createdAt", ud.getCreatedAt() != null ? ud.getCreatedAt().toString() : getFileCreationTime(Paths.get(ud.getFilePath())));
                        doc.put("employeeName", ud.getEmployeeName());
                        doc.put("month", ud.getMonth());
                        doc.put("year", ud.getYear());
                        if (ud.getPayslip() != null && ud.getPayslip().getCpf() != null) {
                            doc.put("cpf", ud.getPayslip().getCpf());
                        }
                        documents.add(doc);
                        log.debug("ðŸ“„ Adicionado do banco: {}", ud.getFilePath());
                    }
                }
            } catch (Exception e) {
                log.warn("âš ï¸ Erro ao buscar documentos unificados no banco: {}", e.getMessage());
            }
            
            log.info("âœ… Encontrados {} documentos unificados (arquivos + banco)", documents.size());
            return documents;
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao listar documentos unificados: {}", e.getMessage(), e);
            throw new IOException("Erro ao listar documentos unificados: " + e.getMessage(), e);
        }
    }

    /**
     * Lista documentos unificados por perÃ­odo
     */
    public List<Map<String, Object>> listUnifiedDocumentsByPeriod(Integer month, Integer year) throws IOException {
        log.info("ðŸ“‹ Listando documentos unificados por perÃ­odo: {}/{}", month, year);
        
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
        
        log.info("âœ… Encontrados {} documentos para o perÃ­odo {}/{}", filteredDocuments.size(), month, year);
        return filteredDocuments;
    }

    /**
     * Busca documentos unificados por nome do funcionÃ¡rio
     */
    /**
     * Busca documentos unificados por mÃºltiplos critÃ©rios
     * DÃ¡ preferÃªncia aos dados do holerite quando disponÃ­vel
     */
    public List<Map<String, Object>> searchUnifiedDocuments(String searchTerm) throws IOException {
        if (searchTerm == null || searchTerm.trim().length() < 4) {
            log.warn("âš ï¸ Termo de busca muito curto (mÃ­nimo 4 caracteres): {}", searchTerm);
            return Collections.emptyList();
        }
        
        log.info("ðŸ” Buscando documentos unificados com termo: '{}'", searchTerm);
        
        String trimmedSearch = searchTerm.trim();
        String normalizedSearch = normalizeNameForSearch(trimmedSearch);
        String searchLower = trimmedSearch.toLowerCase();
        
        // Buscar todos os documentos
        List<Map<String, Object>> allDocuments = listAllUnifiedDocuments();
        List<Map<String, Object>> filteredDocuments = new ArrayList<>();
        
        // Buscar holerites correspondentes para enriquecer os dados
        List<Payslip> matchingPayslips = new ArrayList<>();
        try {
            matchingPayslips = payslipService.getAllPayslips().stream()
                .filter(p -> p.getEmployeeName() != null && 
                    (normalizeNameForSearch(p.getEmployeeName()).contains(normalizedSearch) ||
                     p.getEmployeeName().toLowerCase().contains(searchLower) ||
                     (p.getCpf() != null && p.getCpf().replaceAll("[^0-9]", "").contains(trimmedSearch.replaceAll("[^0-9]", ""))) ||
                     (p.getCompanyName() != null && normalizeNameForSearch(p.getCompanyName()).contains(normalizedSearch))))
                .collect(Collectors.toList());
            log.info("ðŸ“Š Encontrados {} holerite(s) correspondentes", matchingPayslips.size());
        } catch (Exception e) {
            log.warn("âš ï¸ Erro ao buscar holerites: {}", e.getMessage());
        }
        
        // Criar mapa de holerites por nome/CPF/perÃ­odo para acesso rÃ¡pido
        Map<String, Payslip> payslipMap = new HashMap<>();
        for (Payslip payslip : matchingPayslips) {
            String key = String.format("%s|%s|%d|%d", 
                normalizeNameForSearch(payslip.getEmployeeName()),
                payslip.getCpf() != null ? payslip.getCpf().replaceAll("[^0-9]", "") : "",
                payslip.getMonth(), payslip.getYear());
            payslipMap.put(key, payslip);
        }
        
        // Filtrar documentos unificados
        for (Map<String, Object> doc : allDocuments) {
            if (matchesSearchTerm(doc, normalizedSearch, searchLower, trimmedSearch, payslipMap)) {
                // Enriquecer documento com dados do holerite se disponÃ­vel
                enrichDocumentWithPayslipData(doc, payslipMap);
                filteredDocuments.add(doc);
            }
        }
        
        // Ordenar: documentos com dados do holerite primeiro
        filteredDocuments.sort((d1, d2) -> {
            boolean d1HasPayslip = d1.containsKey("payslipData") && d1.get("payslipData") != null;
            boolean d2HasPayslip = d2.containsKey("payslipData") && d2.get("payslipData") != null;
            
            if (d1HasPayslip && !d2HasPayslip) return -1;
            if (!d1HasPayslip && d2HasPayslip) return 1;
            
            // Se ambos tÃªm ou nÃ£o tÃªm, ordenar por data (mais recente primeiro)
            Integer year1 = (Integer) d1.get("year");
            Integer year2 = (Integer) d2.get("year");
            Integer month1 = (Integer) d1.get("month");
            Integer month2 = (Integer) d2.get("month");
            
            if (year1 != null && year2 != null) {
                int yearCompare = year2.compareTo(year1);
                if (yearCompare != 0) return yearCompare;
            }
            if (month1 != null && month2 != null) {
                return month2.compareTo(month1);
            }
            return 0;
        });
        
        log.info("âœ… Encontrados {} documentos unificados para busca: '{}'", filteredDocuments.size(), trimmedSearch);
        return filteredDocuments;
    }
    
    /**
     * Verifica se um documento corresponde ao termo de busca
     */
    private boolean matchesSearchTerm(Map<String, Object> doc, String normalizedSearch, 
                                     String searchLower, String trimmedSearch, 
                                     Map<String, Payslip> payslipMap) {
        // Buscar por nome do funcionÃ¡rio
        String employeeName = (String) doc.get("employeeName");
        if (employeeName != null) {
            String normalizedName = normalizeNameForSearch(employeeName);
            if (normalizedName.contains(normalizedSearch) || 
                employeeName.toLowerCase().contains(searchLower)) {
                return true;
            }
        }
        
        // Buscar por CPF
        String cpf = (String) doc.get("cpf");
        if (cpf != null) {
            String cpfDigits = cpf.replaceAll("[^0-9]", "");
            String searchDigits = trimmedSearch.replaceAll("[^0-9]", "");
            if (!searchDigits.isEmpty() && cpfDigits.contains(searchDigits)) {
                return true;
            }
        }
        
        // Buscar por perÃ­odo (MM/YYYY ou MM-YYYY)
        Integer month = (Integer) doc.get("month");
        Integer year = (Integer) doc.get("year");
        if (month != null && year != null) {
            String period1 = String.format("%02d/%d", month, year);
            String period2 = String.format("%02d-%d", month, year);
            String period3 = String.format("%d/%d", month, year);
            if (trimmedSearch.contains(period1) || trimmedSearch.contains(period2) || 
                trimmedSearch.contains(period3) || trimmedSearch.contains(String.valueOf(year))) {
                return true;
            }
        }
        
        // Buscar no nome do arquivo
        String fileName = (String) doc.get("fileName");
        if (fileName != null && fileName.toLowerCase().contains(searchLower)) {
            return true;
        }
        
        // Buscar nos dados do holerite associado (se disponÃ­vel)
        for (Payslip payslip : payslipMap.values()) {
            String key = String.format("%s|%s|%d|%d", 
                normalizeNameForSearch(payslip.getEmployeeName()),
                payslip.getCpf() != null ? payslip.getCpf().replaceAll("[^0-9]", "") : "",
                payslip.getMonth(), payslip.getYear());
            
            Integer docMonth = (Integer) doc.get("month");
            Integer docYear = (Integer) doc.get("year");
            String docEmployeeName = (String) doc.get("employeeName");
            
            if (docMonth != null && docYear != null && docEmployeeName != null &&
                docMonth.equals(payslip.getMonth()) && 
                docYear.equals(payslip.getYear()) &&
                normalizeNameForSearch(docEmployeeName).equals(normalizeNameForSearch(payslip.getEmployeeName()))) {
                // Verificar se o holerite corresponde Ã  busca
                if (payslip.getCompanyName() != null && 
                    normalizeNameForSearch(payslip.getCompanyName()).contains(normalizedSearch)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Enriquece documento com dados do holerite quando disponÃ­vel
     */
    private void enrichDocumentWithPayslipData(Map<String, Object> doc, Map<String, Payslip> payslipMap) {
        String employeeName = (String) doc.get("employeeName");
        Integer month = (Integer) doc.get("month");
        Integer year = (Integer) doc.get("year");
        
        if (employeeName != null && month != null && year != null) {
            String key = String.format("%s|%s|%d|%d", 
                normalizeNameForSearch(employeeName),
                doc.get("cpf") != null ? ((String) doc.get("cpf")).replaceAll("[^0-9]", "") : "",
                month, year);
            
            Payslip matchingPayslip = payslipMap.values().stream()
                .filter(p -> p.getMonth().equals(month) && 
                            p.getYear().equals(year) &&
                            normalizeNameForSearch(p.getEmployeeName()).equals(normalizeNameForSearch(employeeName)))
                .findFirst()
                .orElse(null);
            
            if (matchingPayslip != null) {
                Map<String, Object> payslipData = new HashMap<>();
                payslipData.put("cpf", matchingPayslip.getCpf());
                payslipData.put("companyName", matchingPayslip.getCompanyName());
                payslipData.put("companyCnpj", matchingPayslip.getCompanyCnpj());
                payslipData.put("workPostName", matchingPayslip.getWorkPostName());
                payslipData.put("netValue", matchingPayslip.getNetValue());
                doc.put("payslipData", payslipData);
                log.debug("âœ… Documento enriquecido com dados do holerite: {}", employeeName);
            }
        }
    }
    
    /**
     * Busca documentos unificados por nome do funcionÃ¡rio (mÃ©todo legado - mantido para compatibilidade)
     */
    public List<Map<String, Object>> searchUnifiedDocumentsByEmployee(String employeeName) throws IOException {
        return searchUnifiedDocuments(employeeName);
    }

    /**
     * Lista documentos unificados por CPF do funcionÃ¡rio
     */
    public List<Map<String, Object>> listUnifiedDocumentsByCpf(String cpf) throws IOException {
        log.info("ðŸ” Buscando documentos unificados para CPF: {}", cpf);

        String sanitizedCpf = sanitizeCpf(cpf);
        if (sanitizedCpf.isEmpty()) {
            log.warn("âš ï¸ CPF informado vazio ou invÃ¡lido. Retornando lista vazia.");
            return Collections.emptyList();
        }

        Optional<User> userOptional = userRepository.findByUsername(sanitizedCpf);
        Optional<Employee> employeeOptional = employeeRepository.findByDocument(sanitizedCpf);

        Set<String> normalizedNames = new HashSet<>();
        userOptional.map(User::getName).map(this::normalizeName).ifPresent(normalizedNames::add);
        employeeOptional.map(Employee::getName).map(this::normalizeName).ifPresent(normalizedNames::add);

        List<Map<String, Object>> allDocuments = listAllUnifiedDocuments();
        List<Map<String, Object>> filteredDocuments = allDocuments.stream()
                .filter(doc -> matchesDocumentForUser(doc, sanitizedCpf, normalizedNames))
                .collect(Collectors.toList());

        log.info("âœ… Encontrados {} documentos unificados para CPF: {}", filteredDocuments.size(), cpf);
        return filteredDocuments;
    }

    private boolean matchesDocumentForUser(Map<String, Object> doc, String sanitizedCpf, Set<String> normalizedNames) {
        if (doc == null) {
            return false;
        }

        String fileName = String.valueOf(doc.getOrDefault("fileName", ""));
        String documentCpf = sanitizeCpf(String.valueOf(doc.getOrDefault("cpf", "")));

        if (!sanitizedCpf.isEmpty() && (fileName.contains(sanitizedCpf) || documentCpf.contains(sanitizedCpf))) {
            return true;
        }

        String employeeName = String.valueOf(doc.getOrDefault("employeeName", ""));
        String normalizedEmployeeName = normalizeName(employeeName);

        return normalizedNames.stream()
                .filter(name -> !name.isEmpty())
                .anyMatch(name ->
                        normalizedEmployeeName.equals(name) ||
                                normalizedEmployeeName.contains(name) ||
                                name.contains(normalizedEmployeeName));
    }

    private String sanitizeCpf(String cpf) {
        if (cpf == null) {
            return "";
        }
        return cpf.replaceAll("\\D", "");
    }

    private String normalizeName(String value) {
        if (value == null) {
            return "";
        }
        String withoutAccents = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return withoutAccents.replaceAll("[^a-zA-Z0-9]", "")
                .toLowerCase();
    }

    /**
     * Extrai nome do funcionÃ¡rio do nome do arquivo
     */
    private String extractEmployeeNameFromFileName(String fileName) {
        try {
            // Remove prefixos e extensÃµes
            String name = fileName
                .replace("HOLERITE_", "")
                .replace("RECIBO_recibo_", "")
                .replace(".pdf", "");
            
            // Extrai o nome (remove CPF e perÃ­odo)
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
            log.warn("âš ï¸ Erro ao extrair nome do funcionÃ¡rio do arquivo: {}", fileName);
            return "Nome nÃ£o identificado";
        }
    }

    /**
     * ObtÃ©m tamanho do arquivo
     */
    private long getFileSize(Path path) {
        try {
            return Files.size(path);
        } catch (IOException e) {
            return 0;
        }
    }

    /**
     * ObtÃ©m data de criaÃ§Ã£o do arquivo
     */
    private String getFileCreationTime(Path path) {
        try {
            return Files.getAttribute(path, "creationTime").toString();
        } catch (IOException e) {
            return "Data nÃ£o disponÃ­vel";
        }
    }

    /**
     * Verifica se os nomes dos funcionÃ¡rios coincidem (com suporte a nomes truncados)
     */
    private boolean verifyEmployeeNames(String holeriteName, String receiptName) {
        if (holeriteName == null || receiptName == null) {
            log.warn("âš ï¸ Nome nulo detectado na verificaÃ§Ã£o flexÃ­vel - Holerite: {}, Recibo: {}", holeriteName, receiptName);
            return false;
        }
        
        // Normalizar nomes (remover espaÃ§os extras, converter para minÃºsculas, remover acentos)
        String normalizedHolerite = normalizeNameForSearch(holeriteName);
        String normalizedReceipt = normalizeNameForSearch(receiptName);
        
        log.info("ðŸ” Comparando nomes (verificaÃ§Ã£o flexÃ­vel com abreviaÃ§Ãµes):");
        log.info("  Holerite original: '{}'", holeriteName);
        log.info("  Recibo original: '{}'", receiptName);
        log.info("  Holerite normalizado: '{}'", normalizedHolerite);
        log.info("  Recibo normalizado: '{}'", normalizedReceipt);
        
        // VerificaÃ§Ã£o exata
        boolean exactMatch = normalizedHolerite.equals(normalizedReceipt);
        
        // VerificaÃ§Ã£o parcial (se um nome contÃ©m o outro)
        boolean partialMatch = normalizedHolerite.contains(normalizedReceipt) || 
                              normalizedReceipt.contains(normalizedHolerite);
        
        // VerificaÃ§Ã£o por palavras-chave (primeiro e Ãºltimo nome) - com suporte a truncamentos E ABREVIAÃ‡Ã•ES
        boolean keywordMatch = checkKeywordMatch(normalizedHolerite, normalizedReceipt);
        
        // VerificaÃ§Ã£o limpa (removendo palavras comuns)
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
        
        // VerificaÃ§Ã£o por prefixo do Ãºltimo nome (para lidar com truncamentos: PEREIRA vs PERE)
        boolean truncatedLastMatch = checkTruncatedLastName(normalizedHolerite, normalizedReceipt);
        
        // NOVA: VerificaÃ§Ã£o especÃ­fica para abreviaÃ§Ãµes de nomes do meio
        boolean abbreviationMatch = checkNamesWithAbbreviations(normalizedHolerite, normalizedReceipt);
        
        log.info("ðŸ” Resultados da verificaÃ§Ã£o flexÃ­vel:");
        log.info("  Match exato: {}", exactMatch);
        log.info("  Match parcial: {}", partialMatch);
        log.info("  Match por palavras-chave (com abreviaÃ§Ãµes): {}", keywordMatch);
        log.info("  Match limpo: {}", cleanMatch);
        log.info("  Match por Ãºltimo nome truncado: {}", truncatedLastMatch);
        log.info("  Match por abreviaÃ§Ãµes: {}", abbreviationMatch);
        
        // Retorna true se qualquer verificaÃ§Ã£o passar
        return exactMatch || partialMatch || keywordMatch || cleanMatch || truncatedLastMatch || abbreviationMatch;
    }
    
    /**
     * Verifica se os nomes correspondem considerando abreviaÃ§Ãµes de nomes do meio (1-3 caracteres)
     * Ex: "SILVANA FERREIRA S HONORATO" vs "SILVANA FERREIRA SELVO HONORATO"
     */
    private boolean checkNamesWithAbbreviations(String name1, String name2) {
        String[] words1 = name1.split("\\s+");
        String[] words2 = name2.split("\\s+");
        
        if (words1.length < 2 || words2.length < 2) {
            return false;
        }
        
        // Verificar primeiro e Ãºltimo nome primeiro
        String first1 = words1[0];
        String last1 = words1[words1.length - 1];
        String first2 = words2[0];
        String last2 = words2[words2.length - 1];
        
        // Primeiro e Ãºltimo nome devem corresponder (com suporte a abreviaÃ§Ãµes)
        boolean firstMatch = first1.equalsIgnoreCase(first2) || 
                            wordsMatchWithAbbreviation(first1, first2) ||
                            (first1.length() >= 3 && first2.length() >= 3 && 
                             (first1.toLowerCase().contains(first2.toLowerCase()) || first2.toLowerCase().contains(first1.toLowerCase())));
        boolean lastMatch = last1.equalsIgnoreCase(last2) || 
                           wordsMatchWithAbbreviation(last1, last2) ||
                           (last1.length() >= 3 && last2.length() >= 3 && 
                            (last1.toLowerCase().contains(last2.toLowerCase()) || last2.toLowerCase().contains(last1.toLowerCase())));
        
        if (!firstMatch || !lastMatch) {
            return false;
        }
        
        // Se primeiro e Ãºltimo batem, verificar nomes do meio com abreviaÃ§Ãµes
        return checkMiddleNamesWithAbbreviations(words1, words2);
    }

    /**
     * Verifica match por palavras-chave (primeiro e Ãºltimo nome) - com suporte a truncamentos e abreviaÃ§Ãµes
     * Trata corretamente nomes com preposiÃ§Ãµes como "DA COSTA", "DE SOUZA", etc.
     */
    private boolean checkKeywordMatch(String name1, String name2) {
        // Primeiro, normalizar os nomes para garantir que preposiÃ§Ãµes sejam tratadas corretamente
        String normalized1 = normalizeNameForSearch(name1);
        String normalized2 = normalizeNameForSearch(name2);
        
        String[] words1 = normalized1.split("\\s+");
        String[] words2 = normalized2.split("\\s+");
        
        if (words1.length < 2 || words2.length < 2) {
            // Se nÃ£o tem pelo menos 2 palavras, usar matching por contenÃ§Ã£o
            return normalized1.contains(normalized2) || normalized2.contains(normalized1);
        }
        
        // Verificar primeiro e Ãºltimo nome
        String first1 = words1[0];
        String last1 = words1[words1.length - 1];
        String first2 = words2[0];
        String last2 = words2[words2.length - 1];
        
        // Log para debug
        log.debug("ðŸ” checkKeywordMatch - name1: '{}' (normalizado: '{}'), name2: '{}' (normalizado: '{}')", 
            name1, normalized1, name2, normalized2);
        log.debug("  words1: {}, first1: '{}', last1: '{}'", java.util.Arrays.toString(words1), first1, last1);
        log.debug("  words2: {}, first2: '{}', last2: '{}'", java.util.Arrays.toString(words2), first2, last2);
        
        // Primeiro nome: exato, um contÃ©m o outro, ou um Ã© abreviaÃ§Ã£o do outro
        boolean firstMatch = first1.equalsIgnoreCase(first2) || 
                            wordsMatchWithAbbreviation(first1, first2) ||
                            (first1.length() >= 3 && first2.length() >= 3 && 
                             (first1.toLowerCase().contains(first2.toLowerCase()) || first2.toLowerCase().contains(first1.toLowerCase())));
        
        // Ãšltimo nome: exato, um contÃ©m o outro, um Ã© prefixo do outro (truncamentos), ou um Ã© abreviaÃ§Ã£o do outro
        boolean lastMatch = last1.equalsIgnoreCase(last2) || 
                           wordsMatchWithAbbreviation(last1, last2) ||
                           (last1.length() >= 3 && last2.length() >= 3 && 
                            (last1.toLowerCase().contains(last2.toLowerCase()) || last2.toLowerCase().contains(last1.toLowerCase()))) ||
                           (last1.length() >= 4 && last2.length() >= 4 && 
                            (last1.toLowerCase().startsWith(last2.toLowerCase()) || last2.toLowerCase().startsWith(last1.toLowerCase())));
        
        // Verificar nomes do meio com suporte a abreviaÃ§Ãµes (1-3 caracteres)
        boolean middleMatch = checkMiddleNamesWithAbbreviations(words1, words2);
        
        log.info("ðŸ” VerificaÃ§Ã£o por palavras-chave:");
        log.info("  Primeiro nome: '{}' = '{}' ? {}", first1, first2, firstMatch);
        log.info("  Ãšltimo nome: '{}' = '{}' ? {}", last1, last2, lastMatch);
        log.info("  Nomes do meio (com abreviaÃ§Ãµes): {}", middleMatch);
        
        // Se primeiro e Ãºltimo nome batem, e os nomes do meio tambÃ©m batem (ou nÃ£o hÃ¡ nomes do meio), Ã© match
        return firstMatch && lastMatch && (middleMatch || words1.length <= 2 || words2.length <= 2);
    }
    
    /**
     * Verifica se os nomes do meio correspondem, considerando abreviaÃ§Ãµes (1-3 caracteres)
     * Ex: "FERREIRA S HONORATO" vs "FERREIRA SELVO HONORATO" -> "S" Ã© abreviaÃ§Ã£o de "SELVO"
     */
    private boolean checkMiddleNamesWithAbbreviations(String[] words1, String[] words2) {
        // Se nÃ£o hÃ¡ nomes do meio (apenas primeiro e Ãºltimo), retornar true
        if (words1.length <= 2 && words2.length <= 2) {
            return true;
        }
        
        // Pegar nomes do meio (excluindo primeiro e Ãºltimo)
        List<String> middle1 = new ArrayList<>();
        List<String> middle2 = new ArrayList<>();
        
        for (int i = 1; i < words1.length - 1; i++) {
            middle1.add(words1[i]);
        }
        for (int i = 1; i < words2.length - 1; i++) {
            middle2.add(words2[i]);
        }
        
        // Se um nÃ£o tem nomes do meio e o outro tem, verificar se os nomes do meio do outro podem ser abreviaÃ§Ãµes
        if (middle1.isEmpty() && !middle2.isEmpty()) {
            // Verificar se todos os nomes do meio de words2 sÃ£o abreviaÃ§Ãµes que podem corresponder a palavras em words1
            return checkIfAllAreAbbreviations(middle2, words1);
        }
        if (middle2.isEmpty() && !middle1.isEmpty()) {
            return checkIfAllAreAbbreviations(middle1, words2);
        }
        
        // Se ambos tÃªm nomes do meio, comparar considerando abreviaÃ§Ãµes
        if (middle1.size() == middle2.size()) {
            // Comparar palavra por palavra
            for (int i = 0; i < middle1.size(); i++) {
                String w1 = middle1.get(i);
                String w2 = middle2.get(i);
                
                if (!wordsMatchWithAbbreviation(w1, w2)) {
                    return false;
                }
            }
            return true;
        } else {
            // NÃºmeros diferentes de nomes do meio - tentar matching flexÃ­vel
            return flexibleMiddleNameMatch(middle1, middle2, words1, words2);
        }
    }
    
    /**
     * Verifica se uma palavra corresponde a outra, considerando abreviaÃ§Ãµes (1-3 caracteres)
     */
    /**
     * Verifica se duas palavras correspondem, considerando abreviaÃ§Ãµes (1-3 caracteres)
     * Exemplos:
     * - "M" (abreviado) vs "MARIO" (completo) -> true (MARIO comeÃ§a com M)
     * - "J" (abreviado) vs "JOSE" (completo) -> true (JOSE comeÃ§a com J)
     * - "JOSE" vs "JOSE" -> true (exato)
     */
    private boolean wordsMatchWithAbbreviation(String word1, String word2) {
        if (word1 == null || word2 == null) {
            return false;
        }
        
        String w1 = word1.trim();
        String w2 = word2.trim();
        
        if (w1.isEmpty() || w2.isEmpty()) {
            return false;
        }
        
        // VerificaÃ§Ã£o exata (case-insensitive)
        if (w1.equalsIgnoreCase(w2)) {
            return true;
        }
        
        // Se uma palavra tem 1-3 caracteres, pode ser abreviaÃ§Ã£o da outra
        // Ex: "M" (1 char) Ã© abreviaÃ§Ã£o de "MARIO" (5 chars)
        if (w1.length() >= 1 && w1.length() <= 3 && w2.length() > w1.length()) {
            // word1 Ã© abreviaÃ§Ã£o? Verificar se word2 comeÃ§a com word1 (case-insensitive)
            if (w2.toLowerCase().startsWith(w1.toLowerCase())) {
                log.debug("   âœ… AbreviaÃ§Ã£o detectada: '{}' Ã© abreviaÃ§Ã£o de '{}'", w1, w2);
                return true;
            }
        }
        if (w2.length() >= 1 && w2.length() <= 3 && w1.length() > w2.length()) {
            // word2 Ã© abreviaÃ§Ã£o? Verificar se word1 comeÃ§a com word2 (case-insensitive)
            if (w1.toLowerCase().startsWith(w2.toLowerCase())) {
                log.debug("   âœ… AbreviaÃ§Ã£o detectada: '{}' Ã© abreviaÃ§Ã£o de '{}'", w2, w1);
                return true;
            }
        }
        
        // Verificar se uma contÃ©m a outra (para casos como "FERREIRA" vs "FERREIRA")
        if (w1.length() >= 3 && w2.length() >= 3) {
            return w1.toLowerCase().contains(w2.toLowerCase()) || 
                   w2.toLowerCase().contains(w1.toLowerCase());
        }
        
        return false;
    }
    
    /**
     * Verifica se todas as palavras sÃ£o abreviaÃ§Ãµes que correspondem a palavras no nome completo
     */
    private boolean checkIfAllAreAbbreviations(List<String> abbreviations, String[] fullWords) {
        for (String abbrev : abbreviations) {
            boolean found = false;
            // Verificar se a abreviaÃ§Ã£o corresponde a alguma palavra do nome completo
            for (String fullWord : fullWords) {
                if (wordsMatchWithAbbreviation(abbrev, fullWord)) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Matching flexÃ­vel de nomes do meio quando hÃ¡ nÃºmeros diferentes de palavras
     */
    private boolean flexibleMiddleNameMatch(List<String> middle1, List<String> middle2, 
                                           String[] words1, String[] words2) {
        // Tentar encontrar correspondÃªncias entre as palavras do meio
        // Ex: ["FERREIRA", "S"] vs ["FERREIRA", "SELVO"] -> "S" corresponde a "SELVO"
        
        // Criar lista de todas as palavras (exceto primeiro e Ãºltimo) para comparaÃ§Ã£o
        List<String> all1 = new ArrayList<>();
        List<String> all2 = new ArrayList<>();
        
        for (int i = 1; i < words1.length - 1; i++) {
            all1.add(words1[i]);
        }
        for (int i = 1; i < words2.length - 1; i++) {
            all2.add(words2[i]);
        }
        
        // Para cada palavra em all1, verificar se hÃ¡ correspondÃªncia em all2
        for (String w1 : all1) {
            boolean found = false;
            for (String w2 : all2) {
                if (wordsMatchWithAbbreviation(w1, w2)) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }
        
        // E vice-versa
        for (String w2 : all2) {
            boolean found = false;
            for (String w1 : all1) {
                if (wordsMatchWithAbbreviation(w1, w2)) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Verifica match por Ãºltimo nome truncado (ex: PEREIRA vs PERE, SOARES PEREIRA vs SOARES PERE)
     */
    private boolean checkTruncatedLastName(String name1, String name2) {
        String[] words1 = name1.split("\\s+");
        String[] words2 = name2.split("\\s+");
        
        if (words1.length < 2 || words2.length < 2) {
            return false;
        }
        
        // Pegar Ãºltimo nome de cada
        String last1 = words1[words1.length - 1];
        String last2 = words2[words2.length - 1];
        
        // Verificar se um Ãºltimo nome Ã© prefixo do outro (com pelo menos 4 caracteres)
        boolean truncatedMatch = false;
        if (last1.length() >= 4 && last2.length() >= 4) {
            // Verificar se um comeÃ§a com o outro (truncamento)
            truncatedMatch = last1.startsWith(last2) || last2.startsWith(last1);
            
            if (truncatedMatch) {
                log.info("ðŸ” Match por Ãºltimo nome truncado encontrado:");
                log.info("  Ãšltimo nome 1: '{}' ({} caracteres)", last1, last1.length());
                log.info("  Ãšltimo nome 2: '{}' ({} caracteres)", last2, last2.length());
                log.info("  Match: {}", truncatedMatch);
            }
        }
        
        // TambÃ©m verificar se os primeiros nomes batem
        if (truncatedMatch) {
            String first1 = words1[0];
            String first2 = words2[0];
            boolean firstMatches = first1.equals(first2) || 
                                  (first1.length() >= 3 && first2.length() >= 3 && 
                                   (first1.contains(first2) || first2.contains(first1)));
            
            if (firstMatches) {
                log.info("âœ… Match completo por Ãºltimo nome truncado: primeiro nome tambÃ©m bate");
                return true;
            }
        }
        
        return truncatedMatch;
    }

    /**
     * Limpa texto para exibiÃ§Ã£o segura no PDF
     */
    private String cleanText(String text) {
        if (text == null) {
            return "N/A";
        }
        
        // Remover caracteres especiais que podem causar problemas no PDF
        return text.replaceAll("[^a-zA-ZÃ€-Ã¿0-9\\s\\.\\-\\,]", "")
                  .replaceAll("\\s+", " ")
                  .trim();
    }

    /**
     * Exclui um documento unificado pelo nome do arquivo
     */
    public boolean deleteUnifiedDocument(String fileName) throws IOException {
        log.info("ðŸ—‘ï¸ Excluindo documento unificado: {}", fileName);
        
        boolean fileDeleted = false;
        boolean dbRecordDeleted = false;
        
        try {
            // PASSO 1: Excluir o arquivo fÃ­sico
            Path basePath = Paths.get("uploads", "unified");
            Path filePath = findFileRecursively(basePath, fileName);
            
            if (filePath != null) {
                log.info("âœ… Arquivo encontrado em: {}", filePath);
                
                // Verificar se Ã© um arquivo PDF
                if (fileName.toLowerCase().endsWith(".pdf")) {
                    // Excluir o arquivo
                    fileDeleted = Files.deleteIfExists(filePath);
                    
                    if (fileDeleted) {
                        log.info("âœ… Arquivo fÃ­sico excluÃ­do com sucesso: {}", fileName);
                        
                        // Tentar excluir a pasta pai se estiver vazia
                        Path parentDir = filePath.getParent();
                        if (parentDir != null && Files.exists(parentDir)) {
                            try {
                                if (Files.list(parentDir).findFirst().isEmpty()) {
                                    Files.deleteIfExists(parentDir);
                                    log.info("âœ… Pasta vazia removida: {}", parentDir);
                                }
                            } catch (IOException e) {
                                log.warn("âš ï¸ NÃ£o foi possÃ­vel verificar/remover pasta pai: {}", e.getMessage());
                            }
                        }
                    } else {
                        log.warn("âš ï¸ Arquivo fÃ­sico nÃ£o pÃ´de ser excluÃ­do: {}", fileName);
                    }
                } else {
                    log.warn("âš ï¸ Tipo de arquivo nÃ£o permitido: {}", fileName);
                }
            } else {
                log.warn("âš ï¸ Arquivo fÃ­sico nÃ£o encontrado: {}", fileName);
            }
            
            // PASSO 2: Excluir o registro do banco de dados
            try {
                List<UnifiedDocument> documentsToDelete = unifiedDocumentRepository.findByFileName(fileName);
                
                if (!documentsToDelete.isEmpty()) {
                    unifiedDocumentRepository.deleteAll(documentsToDelete);
                    dbRecordDeleted = true;
                    log.info("âœ… {} registro(s) excluÃ­do(s) do banco de dados para o arquivo: {}", 
                        documentsToDelete.size(), fileName);
                } else {
                    log.warn("âš ï¸ Nenhum registro encontrado no banco para o arquivo: {}", fileName);
                }
            } catch (Exception dbError) {
                log.error("ðŸ’¥ Erro ao excluir registro do banco de dados: {}", dbError.getMessage(), dbError);
                // Continuar mesmo se falhar a exclusÃ£o do banco
            }
            
            // Retornar true se pelo menos uma operaÃ§Ã£o foi bem-sucedida
            return fileDeleted || dbRecordDeleted;
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao excluir documento: {}", e.getMessage(), e);
            throw new IOException("Erro ao excluir documento: " + e.getMessage(), e);
        }
    }

    /**
     * MÃ©todo auxiliar para encontrar arquivo recursivamente
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
            log.error("ðŸ’¥ Erro ao procurar arquivo recursivamente: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Cria documentos unificados para todos os funcionÃ¡rios automaticamente
     */
    public List<String> createAllUnifiedDocuments() throws IOException {
        log.info("ðŸŽ¯ Criando holerites expandidos para todos os funcionÃ¡rios...");
        
        List<String> createdDocuments = new ArrayList<>();
        
        try {
            // Buscar todos os holerites disponÃ­veis
            log.info("ðŸ” Buscando holerites no serviÃ§o...");
            List<Payslip> payslips = payslipService.getAllPayslips();
            log.info("ðŸ“Š Encontrados {} holerites", payslips.size());
            
            if (payslips.isEmpty()) {
                log.warn("âš ï¸ Nenhum holerite encontrado para processar");
                return createdDocuments;
            }
            
            // Mostrar detalhes dos holerites encontrados
            log.info("ðŸ“‹ Detalhes dos holerites encontrados:");
            for (Payslip payslip : payslips) {
                log.info("  - ID: {}, Nome: '{}', MÃªs: {}, Ano: {}, CPF: '{}'", 
                    payslip.getId(), 
                    payslip.getEmployeeName(), 
                    payslip.getMonth(), 
                    payslip.getYear(), 
                    payslip.getCpf());
            }
            
            // Agrupar holerites por funcionÃ¡rio e perÃ­odo
            Map<String, List<Payslip>> payslipsByEmployee = payslips.stream()
                .filter(payslip -> payslip.getEmployeeName() != null && 
                                 payslip.getMonth() != null && 
                                 payslip.getYear() != null)
                .collect(Collectors.groupingBy(payslip -> 
                    payslip.getEmployeeName().trim().toUpperCase() + "_" + payslip.getMonth() + "_" + payslip.getYear()
                ));
            
            log.info("ðŸ‘¥ FuncionÃ¡rios Ãºnicos encontrados: {}", payslipsByEmployee.size());
            log.info("ðŸ”‘ Chaves de agrupamento:");
            payslipsByEmployee.keySet().forEach(key -> log.info("  - {}", key));
            
            // Para cada funcionÃ¡rio, buscar recibos correspondentes e criar holerite expandido
            for (Map.Entry<String, List<Payslip>> entry : payslipsByEmployee.entrySet()) {
                List<Payslip> employeePayslips = entry.getValue();
                
                if (employeePayslips.isEmpty()) continue;
                
                Payslip firstPayslip = employeePayslips.get(0);
                String employeeName = firstPayslip.getEmployeeName();
                Integer month = firstPayslip.getMonth();
                Integer year = firstPayslip.getYear();
                
                log.info("ðŸ” Processando funcionÃ¡rio: '{}' - {}/{}", employeeName, month, year);
                
                try {
                    // REGRA DE NEGÃ“CIO MELHORADA: O comprovante pode ser do mÃªs ANTERIOR, MESMO mÃªs ou SEGUINTE
                    // Ex: Holerite de setembro -> Comprovante de agosto, setembro ou outubro
                    int receiptMonthPrev = month == 1 ? 12 : month - 1;
                    int receiptYearPrev = month == 1 ? year - 1 : year;
                    int receiptMonthNext = month == 12 ? 1 : month + 1;
                    int receiptYearNext = month == 12 ? year + 1 : year;
                    
                    log.info("ðŸ” Buscando comprovante para holerite {}/{} -> tentando comprovantes: {}/{} (anterior), {}/{} (mesmo), {}/{} (seguinte)", 
                        month, year, receiptMonthPrev, receiptYearPrev, month, year, receiptMonthNext, receiptYearNext);
                    
                    // Usar Set para evitar duplicatas
                    java.util.Set<PaymentReceipt> allReceiptsSet = new java.util.HashSet<>();
                    
                    // ESTRATÃ‰GIA 1: Buscar por CPF via Employee (mais preciso)
                    String payslipCpf = firstPayslip.getCpf();
                    if (payslipCpf != null && !payslipCpf.trim().isEmpty()) {
                        try {
                            String normalizedCpf = payslipCpf.replaceAll("[^0-9]", "");
                            log.info("ðŸ” EstratÃ©gia 1: Buscando Employee por CPF: {}", normalizedCpf);
                            
                            Optional<com.z7design.fleet_manager.model.Employee> employeeOpt = employeeRepository.findByCpf(normalizedCpf);
                            if (employeeOpt.isPresent()) {
                                UUID employeeId = employeeOpt.get().getId();
                                log.info("âœ… Employee encontrado por CPF: {} (ID: {})", employeeOpt.get().getName(), employeeId);
                                
                                // Buscar comprovantes por employeeId
                                List<PaymentReceipt> receiptsByEmployeeId = receiptRepository.findByEmployeeId(employeeId);
                                allReceiptsSet.addAll(receiptsByEmployeeId);
                                log.info("ðŸ“‹ Encontrados {} comprovante(s) por employeeId", receiptsByEmployeeId.size());
                            } else {
                                log.warn("âš ï¸ Employee nÃ£o encontrado por CPF: {}", normalizedCpf);
                            }
                        } catch (Exception e) {
                            log.warn("âš ï¸ Erro ao buscar Employee por CPF: {}", e.getMessage());
                        }
                    }
                    
                    // ESTRATÃ‰GIA 2: Buscar por nome completo (contains ignore case)
                    String normalizedName = normalizeNameForSearch(employeeName);
                    log.info("ðŸ” EstratÃ©gia 2: Buscando comprovantes por nome completo '{}' (normalizado: '{}')", employeeName, normalizedName);
                    
                    List<PaymentReceipt> receiptsByName = receiptRepository
                        .findByEmployeeNameContainingIgnoreCase(employeeName);
                    allReceiptsSet.addAll(receiptsByName);
                    log.info("ðŸ“‹ Encontrados {} comprovante(s) por nome completo", receiptsByName.size());
                    
                    // ESTRATÃ‰GIA 3: Buscar por partes do nome (primeiro e Ãºltimo nome)
                    String[] nameParts = employeeName.trim().toUpperCase().split("\\s+");
                    if (nameParts.length >= 2) {
                        String firstName = nameParts[0];
                        String lastName = nameParts[nameParts.length - 1];
                        log.info("ðŸ” EstratÃ©gia 3: Buscando por primeiro nome '{}' e Ãºltimo nome '{}'", firstName, lastName);
                        
                        // Buscar por primeiro nome
                        List<PaymentReceipt> receiptsByFirst = receiptRepository
                            .findByEmployeeNameContainingIgnoreCase(firstName);
                        for (PaymentReceipt receipt : receiptsByFirst) {
                            if (receipt.getEmployeeName() != null) {
                                String receiptNameUpper = receipt.getEmployeeName().toUpperCase();
                                // Verificar se contÃ©m o Ãºltimo nome
                                if (receiptNameUpper.contains(lastName)) {
                                    allReceiptsSet.add(receipt);
                                }
                            }
                        }
                        log.info("ðŸ“‹ Encontrados {} comprovante(s) adicionais por partes do nome", 
                            allReceiptsSet.size() - receiptsByName.size());
                    }
                    
                    // ESTRATÃ‰GIA 4: Buscar por nome normalizado (sem acentos) - mais flexÃ­vel
                    if (!normalizedName.equals(employeeName.trim().toLowerCase())) {
                        String[] normalizedParts = normalizedName.split("\\s+");
                        if (normalizedParts.length > 0 && normalizedParts[0].length() >= 3) {
                            log.info("ðŸ” EstratÃ©gia 4: Buscando por nome normalizado (primeira parte: '{}')", normalizedParts[0]);
                            List<PaymentReceipt> receiptsByNormalized = receiptRepository
                                .findByEmployeeNameContainingIgnoreCase(normalizedParts[0]);
                            for (PaymentReceipt receipt : receiptsByNormalized) {
                                String receiptNormalized = normalizeNameForSearch(receipt.getEmployeeName());
                                // Verificar se hÃ¡ overlap significativo entre os nomes normalizados
                                if (normalizedName.contains(receiptNormalized) || 
                                    receiptNormalized.contains(normalizedName) ||
                                    calculateNameSimilarity(normalizedName, receiptNormalized) >= 0.6) {
                                    allReceiptsSet.add(receipt);
                                }
                            }
                        }
                    }
                    
                    // ESTRATÃ‰GIA 5: Buscar por Ãºltimo nome apenas (para casos de nomes muito diferentes)
                    if (nameParts.length >= 2) {
                        String lastName = nameParts[nameParts.length - 1];
                        if (lastName.length() >= 4) {
                            log.info("ðŸ” EstratÃ©gia 5: Buscando por Ãºltimo nome '{}' (apenas se >= 4 caracteres)", lastName);
                            List<PaymentReceipt> receiptsByLast = receiptRepository
                                .findByEmployeeNameContainingIgnoreCase(lastName);
                            for (PaymentReceipt receipt : receiptsByLast) {
                                // Verificar se o primeiro nome tambÃ©m bate (pelo menos parcialmente)
                                String receiptNameUpper = receipt.getEmployeeName() != null ? 
                                    receipt.getEmployeeName().toUpperCase() : "";
                                if (receiptNameUpper.contains(nameParts[0].substring(0, Math.min(3, nameParts[0].length())))) {
                                    allReceiptsSet.add(receipt);
                                }
                            }
                        }
                    }
                    
                    List<PaymentReceipt> allReceipts = new ArrayList<>(allReceiptsSet);
                    log.info("ðŸ“Š Total de comprovantes Ãºnicos encontrados (todas as estratÃ©gias): {}", allReceipts.size());
                    
                    // Mostrar detalhes dos recibos encontrados
                    if (!allReceipts.isEmpty()) {
                        log.info("ðŸ“‹ Detalhes dos comprovantes encontrados para '{}':", employeeName);
                        for (PaymentReceipt receipt : allReceipts) {
                            log.info("  - ID: {}, Nome: '{}', MÃªs: {}, Ano: {}, EmployeeId: {}", 
                                receipt.getId(), 
                                receipt.getEmployeeName(), 
                                receipt.getMonth(), 
                                receipt.getYear(),
                                receipt.getEmployeeId());
                        }
                    }
                    
                    // Filtrar por perÃ­odo - EXPANDIDO: mÃªs anterior, mesmo mÃªs e mÃªs seguinte
                    List<PaymentReceipt> matchingReceipts = new ArrayList<>();
                    
                    // Tentativa 1: MÃªs seguinte (pagamento tÃ­pico) - PRIORIDADE ALTA
                    List<PaymentReceipt> receiptsNextMonth = allReceipts.stream()
                        .filter(r -> r.getMonth() != null && r.getMonth().equals(receiptMonthNext))
                        .filter(r -> r.getYear() != null && r.getYear().equals(receiptYearNext))
                        .collect(Collectors.toList());
                    
                    if (!receiptsNextMonth.isEmpty()) {
                        matchingReceipts.addAll(receiptsNextMonth);
                        log.info("âœ… Encontrados {} comprovante(s) no mÃªs seguinte {}/{}", 
                            receiptsNextMonth.size(), receiptMonthNext, receiptYearNext);
                    }
                    
                    // Tentativa 2: Mesmo mÃªs - PRIORIDADE MÃ‰DIA
                    List<PaymentReceipt> receiptsSameMonth = allReceipts.stream()
                        .filter(r -> r.getMonth() != null && r.getMonth().equals(month))
                        .filter(r -> r.getYear() != null && r.getYear().equals(year))
                        .filter(r -> !matchingReceipts.contains(r)) // Evitar duplicatas
                        .collect(Collectors.toList());
                    
                    if (!receiptsSameMonth.isEmpty()) {
                        matchingReceipts.addAll(receiptsSameMonth);
                        log.info("âœ… Encontrados {} comprovante(s) no mesmo mÃªs {}/{}", 
                            receiptsSameMonth.size(), month, year);
                    }
                    
                    // Tentativa 3: MÃªs anterior - PRIORIDADE BAIXA (fallback)
                    if (matchingReceipts.isEmpty()) {
                        List<PaymentReceipt> receiptsPrevMonth = allReceipts.stream()
                            .filter(r -> r.getMonth() != null && r.getMonth().equals(receiptMonthPrev))
                            .filter(r -> r.getYear() != null && r.getYear().equals(receiptYearPrev))
                            .collect(Collectors.toList());
                        
                        if (!receiptsPrevMonth.isEmpty()) {
                            matchingReceipts.addAll(receiptsPrevMonth);
                            log.info("âœ… Encontrados {} comprovante(s) no mÃªs anterior {}/{} (fallback)", 
                                receiptsPrevMonth.size(), receiptMonthPrev, receiptYearPrev);
                        }
                    }
                    
                    // Filtrar por matching de nome usando verificaÃ§Ã£o flexÃ­vel
                    List<PaymentReceipt> matchedByName = matchingReceipts.stream()
                        .filter(receipt -> verifyEmployeeNames(employeeName, receipt.getEmployeeName()))
                        .collect(Collectors.toList());
                    
                    log.info("ðŸ“‹ Comprovantes apÃ³s filtro de nome: {} (de {} por perÃ­odo)", 
                        matchedByName.size(), matchingReceipts.size());
                    
                    // Se nÃ£o encontrou com verificaÃ§Ã£o flexÃ­vel, usar os que passaram pelo perÃ­odo
                    if (matchedByName.isEmpty() && !matchingReceipts.isEmpty()) {
                        log.warn("âš ï¸ Nenhum comprovante passou na verificaÃ§Ã£o de nome, mas {} comprovante(s) encontrado(s) no perÃ­odo. Usando verificaÃ§Ã£o mais flexÃ­vel...", 
                            matchingReceipts.size());
                        
                        // Tentar matching mais flexÃ­vel (primeiro e Ãºltimo nome)
                        matchedByName = matchingReceipts.stream()
                            .filter(receipt -> isFlexibleNameMatch(employeeName, receipt.getEmployeeName()))
                            .collect(Collectors.toList());
                        
                        if (!matchedByName.isEmpty()) {
                            log.info("âœ… Encontrados {} comprovante(s) com matching flexÃ­vel", matchedByName.size());
                        } else {
                            // Ãšltima tentativa: usar todos os que estÃ£o no perÃ­odo se nÃ£o houver nenhum match
                            log.warn("âš ï¸ Nenhum match de nome encontrado, mas usando {} comprovante(s) do perÃ­odo como fallback", matchingReceipts.size());
                            matchedByName = matchingReceipts;
                        }
                    }
                    
                    if (!matchedByName.isEmpty()) {
                        log.info("âœ… Encontrados {} comprovante(s) para {} - {}/{}", matchedByName.size(), employeeName, month, year);
                        
                        // Criar holerite expandido com todos os recibos
                        String expandedPath = createExpandedHolerite(firstPayslip, matchedByName);
                        createdDocuments.add(expandedPath);
                        
                        log.info("âœ… Holerite expandido criado: {}", expandedPath);
                    } else {
                        log.warn("âš ï¸ Nenhum comprovante encontrado para {} - holerite {}/{} (procurando comprovante {}/{} ou {}/{})", 
                            employeeName, month, year, receiptMonthNext, receiptYearNext, month, year);
                        log.warn("   Total de comprovantes no banco para nome '{}': {}", employeeName, allReceipts.size());
                        if (!allReceipts.isEmpty()) {
                            log.warn("   PerÃ­odos dos comprovantes encontrados:");
                            allReceipts.forEach(r -> log.warn("     - {}: {}/{}", 
                                r.getEmployeeName(), r.getMonth(), r.getYear()));
                        }
                    }
                    
                } catch (Exception e) {
                    log.error("ðŸ’¥ Erro ao processar funcionÃ¡rio {}: {}", employeeName, e.getMessage(), e);
                    // Continuar com o prÃ³ximo funcionÃ¡rio
                }
            }
            
            log.info("ðŸŽ‰ Processamento concluÃ­do! {} holerites expandidos criados", createdDocuments.size());
            return createdDocuments;
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao criar holerites expandidos: {}", e.getMessage(), e);
            throw new IOException("Erro ao criar holerites expandidos: " + e.getMessage(), e);
        }
    }

    /**
     * Verifica se os nomes dos funcionÃ¡rios sÃ£o EXATAMENTE iguais
     */
    private boolean isExactNameMatch(String holeriteName, String receiptName) {
        if (holeriteName == null || receiptName == null) {
            log.warn("âš ï¸ Nome nulo detectado - Holerite: {}, Recibo: {}", holeriteName, receiptName);
            return false;
        }
        
        // Normalizar nomes: remover espaÃ§os extras, converter para maiÃºsculas
        String normalizedHolerite = holeriteName.trim().toUpperCase();
        String normalizedReceipt = receiptName.trim().toUpperCase();
        
        // Verificar se sÃ£o exatamente iguais
        boolean exactMatch = normalizedHolerite.equals(normalizedReceipt);
        
        log.info("ðŸ” VerificaÃ§Ã£o EXATA de nomes:");
        log.info("  Holerite original: '{}'", holeriteName);
        log.info("  Recibo original: '{}'", receiptName);
        log.info("  Holerite normalizado: '{}'", normalizedHolerite);
        log.info("  Recibo normalizado: '{}'", normalizedReceipt);
        log.info("  Match EXATO: {}", exactMatch ? "âœ… SIM" : "âŒ NÃƒO");
        
        // Se nÃ£o houver match exato, tentar match mais flexÃ­vel
        if (!exactMatch) {
            // Remover palavras comuns que podem estar causando diferenÃ§as
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
            
            log.info("ðŸ” VerificaÃ§Ã£o LIMPA de nomes:");
            log.info("  Holerite limpo: '{}'", cleanHolerite);
            log.info("  Recibo limpo: '{}'", cleanReceipt);
            log.info("  Match LIMPO: {}", cleanMatch ? "âœ… SIM" : "âŒ NÃƒO");
            
            if (cleanMatch) {
                log.info("âœ… Match encontrado apÃ³s limpeza - aceitando unificaÃ§Ã£o");
                return true;
            }
            
            // Verificar se um nome contÃ©m o outro (mais flexÃ­vel)
            boolean containsMatch = cleanHolerite.contains(cleanReceipt) || cleanReceipt.contains(cleanHolerite);
            log.info("  Match por contenÃ§Ã£o: {}", containsMatch ? "âœ… SIM" : "âŒ NÃƒO");
            
            if (containsMatch) {
                log.info("âœ… Match por contenÃ§Ã£o encontrado - aceitando unificaÃ§Ã£o");
                return true;
            }
        }
        
        return exactMatch;
    }

    /**
     * Normaliza nome para busca (remove acentos, normaliza espaÃ§os, converte para minÃºsculas)
     * Trata variaÃ§Ãµes comuns como "DA COSTA" vs "DACOSTA", "DE SOUZA" vs "DESOUZA", etc.
     * A estratÃ©gia Ã© normalizar removendo espaÃ§os apÃ³s preposiÃ§Ãµes comuns para padronizar.
     */
    /**
     * Normaliza nÃºmero de conta corrente removendo espaÃ§os, hÃ­fens e pontos
     */
    private String normalizeAccountNumber(String account) {
        if (account == null) return "";
        return account.replaceAll("[^0-9]", "");
    }
    
    /**
     * Normaliza CPF removendo formataÃ§Ã£o
     */
    private String normalizeCpf(String cpf) {
        if (cpf == null) return "";
        return cpf.replaceAll("[^0-9]", "");
    }
    
    /**
     * Busca funcionÃ¡rio na tabela employees usando dados do holerite
     * EstratÃ©gia: CPF > Nome exato > Nome parcial
     */
    private Employee findEmployeeForPayslip(Payslip payslip) {
        try {
            // ESTRATÃ‰GIA 1: Buscar por CPF
            if (payslip.getCpf() != null && !payslip.getCpf().trim().isEmpty()) {
                String normalizedCpf = payslip.getCpf().replaceAll("[^0-9]", "");
                if (normalizedCpf.length() >= 11) {
                    Optional<Employee> employeeOpt = employeeRepository.findByCpf(normalizedCpf);
                    if (employeeOpt.isPresent()) {
                        return employeeOpt.get();
                    }
                }
            }
            
            // ESTRATÃ‰GIA 2: Buscar por nome exato
            if (payslip.getEmployeeName() != null && !payslip.getEmployeeName().trim().isEmpty()) {
                Optional<Employee> employeeOpt = employeeRepository.findByNameExact(payslip.getEmployeeName().trim());
                if (employeeOpt.isPresent()) {
                    return employeeOpt.get();
                }
            }
            
            // ESTRATÃ‰GIA 3: Buscar por nome parcial
            if (payslip.getEmployeeName() != null && !payslip.getEmployeeName().trim().isEmpty()) {
                List<Employee> employees = employeeRepository.findByNameContainingIgnoreCase(payslip.getEmployeeName().trim());
                if (!employees.isEmpty()) {
                    // Retornar o primeiro (ou o mais prÃ³ximo se houver lÃ³gica de matching)
                    return employees.get(0);
                }
            }
        } catch (Exception e) {
            log.warn("âš ï¸ Erro ao buscar funcionÃ¡rio na tabela employees: {}", e.getMessage());
        }
        
        return null;
    }
    
    private String normalizeNameForSearch(String name) {
        if (name == null || name.trim().isEmpty()) {
            return "";
        }
        
        // Remover acentos
        String withoutAccents = Normalizer.normalize(name.trim(), Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "");
        
        // Normalizar espaÃ§os e converter para minÃºsculas
        String normalized = withoutAccents
            .replaceAll("\\s+", " ")
            .trim()
            .toLowerCase();
        
        // Primeiro, tratar casos onde preposiÃ§Ãµes estÃ£o juntas com a palavra seguinte
        // Ex: "dacosta" -> "da costa", "desouza" -> "de souza"
        // Isso padroniza para o formato com espaÃ§o
        normalized = normalized
            .replaceAll("\\bda([a-z]{2,})", "da $1")  // "dacosta" -> "da costa"
            .replaceAll("\\bde([a-z]{2,})", "de $1")  // "desouza" -> "de souza"
            .replaceAll("\\bdos([a-z]{2,})", "dos $1") // "dossantos" -> "dos santos"
            .replaceAll("\\bdas([a-z]{2,})", "das $1") // "dasneves" -> "das neves"
            .replaceAll("\\bdo([a-z]{2,})", "do $1")   // "donascimento" -> "do nascimento"
            .replaceAll("\\bdel([a-z]{2,})", "del $1") // "delcastillo" -> "del castillo"
            .replaceAll("\\bdu([a-z]{2,})", "du $1")   // "dumont" -> "du mont"
            .replaceAll("\\bvan([a-z]{2,})", "van $1") // "vanderberg" -> "van derberg"
            .replaceAll("\\bvon([a-z]{2,})", "von $1") // "vonneumann" -> "von neumann"
            .replaceAll("\\s+", " ")                    // Normalizar espaÃ§os
            .trim();
        
        // Agora, remover espaÃ§os apÃ³s preposiÃ§Ãµes para padronizar
        // Ex: "da costa" -> "dacosta", "de souza" -> "desouza"
        // Isso garante que ambos os formatos sejam normalizados para o mesmo resultado
        normalized = normalized
            .replaceAll("\\bda\\s+", "da")  // "da costa" -> "dacosta"
            .replaceAll("\\bde\\s+", "de")  // "de souza" -> "desouza"
            .replaceAll("\\bdos\\s+", "dos") // "dos santos" -> "dossantos"
            .replaceAll("\\bdas\\s+", "das") // "das neves" -> "dasneves"
            .replaceAll("\\bdo\\s+", "do")   // "do nascimento" -> "donascimento"
            .replaceAll("\\bdel\\s+", "del") // "del castillo" -> "delcastillo"
            .replaceAll("\\bdu\\s+", "du")   // "du mont" -> "dumont"
            .replaceAll("\\bvan\\s+", "van") // "van der berg" -> "vanderberg"
            .replaceAll("\\bvon\\s+", "von") // "von neumann" -> "vonneumann"
            .replaceAll("\\s+", " ")         // Normalizar espaÃ§os novamente
            .trim();
        
        // Log mais detalhado para nomes com preposiÃ§Ãµes
        if (normalized.contains("dacosta") || normalized.contains("desouza") || 
            normalized.contains("dossantos") || normalized.contains("dasneves") ||
            name.toLowerCase().contains("da costa") || name.toLowerCase().contains("de souza")) {
            log.info("ðŸ” NormalizaÃ§Ã£o de nome com preposiÃ§Ã£o: '{}' -> '{}'", name, normalized);
        } else {
            log.debug("ðŸ” NormalizaÃ§Ã£o de nome: '{}' -> '{}'", name, normalized);
        }
        
        return normalized;
    }

    /**
     * Calcula similaridade entre dois nomes (0.0 a 1.0)
     * Usa algoritmo de similaridade baseado em palavras comuns
     */
    private double calculateNameSimilarity(String name1, String name2) {
        if (name1 == null || name2 == null || name1.isEmpty() || name2.isEmpty()) {
            return 0.0;
        }
        
        String[] words1 = name1.split("\\s+");
        String[] words2 = name2.split("\\s+");
        
        if (words1.length == 0 || words2.length == 0) {
            return 0.0;
        }
        
        int commonWords = 0;
        int totalWords = Math.max(words1.length, words2.length);
        
        for (String word1 : words1) {
            if (word1.length() >= 3) { // Ignorar palavras muito curtas
                for (String word2 : words2) {
                    if (word2.length() >= 3) {
                        // Verificar match exato ou por prefixo (para truncamentos)
                        if (word1.equals(word2) || 
                            (word1.length() >= 4 && word2.length() >= 4 && 
                             (word1.startsWith(word2) || word2.startsWith(word1)))) {
                            commonWords++;
                            break;
                        }
                    }
                }
            }
        }
        
        return totalWords > 0 ? (double) commonWords / totalWords : 0.0;
    }

    /**
     * Matching flexÃ­vel baseado em primeiro e Ãºltimo nome - com suporte a truncamentos
     */
    private boolean isFlexibleNameMatch(String name1, String name2) {
        if (name1 == null || name2 == null || name1.trim().isEmpty() || name2.trim().isEmpty()) {
            return false;
        }
        
        String normalized1 = normalizeNameForSearch(name1);
        String normalized2 = normalizeNameForSearch(name2);
        
        // Se jÃ¡ sÃ£o iguais apÃ³s normalizaÃ§Ã£o, retornar true
        if (normalized1.equals(normalized2)) {
            return true;
        }
        
        // Usar a mesma lÃ³gica de verificaÃ§Ã£o com abreviaÃ§Ãµes
        return checkNamesWithAbbreviations(normalized1, normalized2) || 
               checkKeywordMatch(normalized1, normalized2);
    }

    /**
     * Cria um holerite expandido preservando o layout original e anexando recibos
     */
    public String createExpandedHolerite(Payslip payslip, List<PaymentReceipt> receipts) throws IOException {
        log.info("=== ðŸŽ¯ CRIANDO HOLERITE EXPANDIDO ===");
        log.info("FuncionÃ¡rio: {}", payslip.getEmployeeName());
        log.info("MÃªs/Ano: {}/{}", payslip.getMonth(), payslip.getYear());
        log.info("Recibos encontrados: {}", receipts.size());

        // Criar diretÃ³rio se nÃ£o existir
        Path expandedPath = Paths.get(UNIFIED_DIR, "expanded").toAbsolutePath();
        if (!Files.exists(expandedPath)) {
            Files.createDirectories(expandedPath);
            log.info("DiretÃ³rio criado: {}", expandedPath);
        }

        // Nome do arquivo expandido
        String fileName = generateExpandedHoleriteFileName(payslip.getEmployeeName(), payslip.getMonth(), payslip.getYear());
        String filePath = expandedPath.resolve(fileName).toString();

        try (PDDocument expandedDocument = new PDDocument()) {
            
            // PÃGINA 1: HOLERITE ORIGINAL (PRESERVANDO LAYOUT)
            log.info("ðŸ“„ Adicionando pÃ¡gina 1: Holerite Original (layout preservado)");
            addOriginalHoleritePage(expandedDocument, payslip);
            
            // PÃGINAS ADICIONAIS: RECIBOS DE PAGAMENTO
            if (!receipts.isEmpty()) {
                for (int i = 0; i < receipts.size(); i++) {
                    PaymentReceipt receipt = receipts.get(i);
                    log.info("ðŸ“„ Adicionando pÃ¡gina {}: Recibo de Pagamento {}", i + 2, i + 1);
                    addReceiptPage(expandedDocument, receipt);
                }
            } else {
                log.info("ðŸ“„ Nenhum recibo para anexar");
            }
            
            // Salvar documento expandido
            expandedDocument.save(filePath);
            log.info("âœ… Holerite expandido criado: {}", filePath);
            
            // Verificar se foi criado
            File savedFile = new File(filePath);
            if (savedFile.exists()) {
                log.info("ðŸ“Š Arquivo verificado: {} bytes", savedFile.length());
            } else {
                throw new IOException("Arquivo expandido nÃ£o foi criado");
            }
            
            return filePath;
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao criar holerite expandido: {}", e.getMessage(), e);
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
                log.info("ðŸ“„ Carregando holerite original: {}", holeriteFilePath);
                
                // Carregar o PDF original
                try (PDDocument holeriteDoc = PDDocument.load(new File(holeriteFilePath))) {
                    // Copiar todas as pÃ¡ginas do holerite original
                    for (int i = 0; i < holeriteDoc.getNumberOfPages(); i++) {
                        PDPage page = holeriteDoc.getPage(i);
                        document.addPage(page);
                        log.info("ðŸ“„ PÃ¡gina {} do holerite original adicionada", i + 1);
                    }
                }
            } else {
                log.warn("âš ï¸ Arquivo original do holerite nÃ£o encontrado, criando pÃ¡gina padrÃ£o");
                // Fallback: criar uma pÃ¡gina padrÃ£o se o arquivo original nÃ£o for encontrado
                addHoleritePage(document, payslip);
            }
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao adicionar holerite original: {}", e.getMessage());
            // Fallback: criar uma pÃ¡gina padrÃ£o em caso de erro
            addHoleritePage(document, payslip);
        }
    }

    /**
     * Tenta encontrar o arquivo PDF original do holerite usando o Payslip do banco
     */
    private String findHoleriteOriginalFile(Payslip payslip) {
        // Usar o mÃ©todo jÃ¡ existente e atualizado
        return findHoleriteOriginalFileByNameAndPeriod(
            payslip.getEmployeeName(), 
            payslip.getMonth(), 
            payslip.getYear()
        );
    }

    /**
     * Gera nome de arquivo para holerite expandido
     */
    private String generateExpandedHoleriteFileName(String employeeName, int month, int year) {
        String cleanName = employeeName.replaceAll("[^a-zA-ZÃ€-Ã¿0-9\\s]", "").replaceAll("\\s+", "_");
        return String.format("HOLERITE_EXPANDIDO_%s_%d_%d.pdf", cleanName.toUpperCase(), month, year);
    }

    /**
     * Adiciona pÃ¡gina de resumo e verificaÃ§Ã£o
     */
    private void addSummaryPage(PDDocument document, Payslip payslip, List<PaymentReceipt> receipts) throws IOException {
        PDPage page = new PDPage();
        document.addPage(page);
        
        PDPageContentStream contentStream = new PDPageContentStream(document, page);
        
        try {
            // Configurar fonte
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 16);
            contentStream.setNonStrokingColor(0, 0, 0);
            
            // TÃ­tulo
            contentStream.beginText();
            contentStream.newLineAtOffset(50, 750);
            contentStream.showText("RESUMO E VERIFICAÃ‡ÃƒO - HOLERITE EXPANDIDO");
            contentStream.endText();
            
            // InformaÃ§Ãµes do funcionÃ¡rio
            contentStream.setFont(PDType1Font.HELVETICA, 12);
            contentStream.beginText();
            contentStream.newLineAtOffset(50, 700);
            contentStream.showText("FuncionÃ¡rio: " + cleanText(payslip.getEmployeeName()));
            contentStream.newLineAtOffset(0, -20);
            contentStream.showText("PerÃ­odo: " + payslip.getMonth() + "/" + payslip.getYear());
            contentStream.newLineAtOffset(0, -20);
            contentStream.showText("Total de Recibos Anexados: " + receipts.size());
            contentStream.endText();
            
            // Lista de recibos
            int yPosition = 570;
            if (!receipts.isEmpty()) {
                contentStream.beginText();
                contentStream.newLineAtOffset(50, 600);
                contentStream.showText("Recibos IncluÃ­dos:");
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
                    
                    // Quebrar pÃ¡gina se necessÃ¡rio
                    if (yPosition < 100 && i < receipts.size() - 1) {
                        contentStream.close();
                        PDPage newPage = new PDPage();
                        document.addPage(newPage);
                        contentStream = new PDPageContentStream(document, newPage);
                        yPosition = 750;
                    }
                }
            }
            
            // VerificaÃ§Ã£o de nomes
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
            contentStream.beginText();
            contentStream.newLineAtOffset(50, yPosition - 40);
            contentStream.showText("VerificaÃ§Ã£o de ConsistÃªncia:");
            contentStream.endText();
            
            contentStream.setFont(PDType1Font.HELVETICA, 10);
            if (!receipts.isEmpty()) {
                boolean namesConsistent = receipts.stream()
                    .allMatch(receipt -> verifyEmployeeNames(payslip.getEmployeeName(), receipt.getEmployeeName()));
                
                contentStream.beginText();
                contentStream.newLineAtOffset(70, yPosition - 60);
                contentStream.showText("Nomes Consistentes: " + (namesConsistent ? "âœ… Sim" : "âŒ NÃ£o"));
                contentStream.endText();
            } else {
                contentStream.beginText();
                contentStream.newLineAtOffset(70, yPosition - 60);
                contentStream.showText("Nomes Consistentes: N/A (sem recibos para comparar)");
                contentStream.endText();
            }
            
            // RodapÃ©
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
     * Cria documentos unificados em lote para mÃºltiplos funcionÃ¡rios
     * Verifica rigorosamente se os nomes no Holerite e Comprovante coincidem
     */
    public com.z7design.fleet_manager.dto.BatchUnificationResult createBatchUnifiedDocuments(
            com.z7design.fleet_manager.dto.BatchUnificationRequest request) {
        
        long startTime = System.currentTimeMillis();
        log.info("=== ðŸŽ¯ INICIANDO UNIFICAÃ‡ÃƒO EM LOTE ===");
        log.info("Filtros: MÃªs={}, Ano={}, ForceUnification={}", 
            request.getMonth(), request.getYear(), request.getForceUnification());
        
        com.z7design.fleet_manager.dto.BatchUnificationResult result = com.z7design.fleet_manager.dto.BatchUnificationResult.builder()
            .successList(new ArrayList<>())
            .failureList(new ArrayList<>())
            .build();
        
        try {
            // OTIMIZAÃ‡ÃƒO 1: PrÃ©-carregar todos os dados necessÃ¡rios de uma vez
            log.info("âš¡ PrÃ©-carregando dados para otimizaÃ§Ã£o...");
            
            // 1. Buscar todos os holerites
            List<Payslip> allPayslips = payslipService.getAllPayslips();
            log.info("ðŸ“Š Total de holerites no banco: {}", allPayslips.size());
            
            // 2. Filtrar por perÃ­odo se especificado
            List<Payslip> filteredPayslips = allPayslips.stream()
                .filter(p -> request.getMonth() == null || p.getMonth().equals(request.getMonth()))
                .filter(p -> request.getYear() == null || p.getYear().equals(request.getYear()))
                .filter(p -> p.getEmployeeName() != null && p.getMonth() != null && p.getYear() != null)
                .toList();
            
            log.info("ðŸ“Š Holerites apÃ³s filtro: {}", filteredPayslips.size());
            result.setTotalProcessed(filteredPayslips.size());
            
            // OTIMIZAÃ‡ÃƒO 2: PrÃ©-carregar todos os employees em um mapa (CPF -> Employee e Nome -> Employee)
            Map<String, Employee> employeesByCpf = new HashMap<>();
            Map<String, Employee> employeesByName = new HashMap<>();
            List<Employee> allEmployees = employeeRepository.findAll();
            for (Employee emp : allEmployees) {
                if (emp.getDocument() != null) {
                    String normalizedCpf = normalizeCpf(emp.getDocument());
                    if (!normalizedCpf.isEmpty()) {
                        employeesByCpf.put(normalizedCpf, emp);
                    }
                }
                if (emp.getName() != null) {
                    String normalizedName = normalizeNameForSearch(emp.getName());
                    if (!normalizedName.isEmpty()) {
                        employeesByName.put(normalizedName, emp);
                    }
                }
            }
            log.info("âš¡ PrÃ©-carregados {} employees em cache", allEmployees.size());
            
            // OTIMIZAÃ‡ÃƒO 3: PrÃ©-carregar comprovantes por perÃ­odo (mÃªs seguinte e mesmo mÃªs)
            Map<String, List<PaymentReceipt>> receiptsByPeriod = new HashMap<>();
            for (Payslip p : filteredPayslips) {
                int receiptMonthNext = p.getMonth() == 12 ? 1 : p.getMonth() + 1;
                int receiptYearNext = p.getMonth() == 12 ? p.getYear() + 1 : p.getYear();
                String keyNext = receiptMonthNext + "_" + receiptYearNext;
                String keySame = p.getMonth() + "_" + p.getYear();
                
                if (!receiptsByPeriod.containsKey(keyNext)) {
                    receiptsByPeriod.put(keyNext, receiptRepository.findByYearAndMonth(receiptYearNext, receiptMonthNext));
                }
                if (!receiptsByPeriod.containsKey(keySame)) {
                    receiptsByPeriod.put(keySame, receiptRepository.findByYearAndMonth(p.getYear(), p.getMonth()));
                }
            }
            log.info("âš¡ PrÃ©-carregados comprovantes para {} perÃ­odos", receiptsByPeriod.size());
            
            // 3. Agrupar por funcionÃ¡rio e perÃ­odo (um documento por funcionÃ¡rio/mÃªs/ano)
            Map<String, Payslip> uniquePayslips = filteredPayslips.stream()
                .collect(Collectors.toMap(
                    p -> p.getEmployeeName().trim().toUpperCase() + "_" + p.getMonth() + "_" + p.getYear(),
                    p -> p,
                    (existing, replacement) -> existing  // Manter o primeiro se houver duplicatas
                ));
            
            log.info("ðŸ‘¥ FuncionÃ¡rios Ãºnicos a processar: {}", uniquePayslips.size());
            
            // 4. Processar cada funcionÃ¡rio
            for (Payslip payslip : uniquePayslips.values()) {
                String employeeName = payslip.getEmployeeName();
                Integer month = payslip.getMonth();
                Integer year = payslip.getYear();
                
                log.info("ðŸ”„ Processando: {} - {}/{}", employeeName, month, year);
                
                com.z7design.fleet_manager.dto.BatchUnificationResult.UnificationDetail detail = 
                    com.z7design.fleet_manager.dto.BatchUnificationResult.UnificationDetail.builder()
                        .employeeName(employeeName)
                        .month(month)
                        .year(year)
                        .build();
                
                try {
                    // 4.1. Buscar arquivo do holerite - PRIMEIRO BUSCAR NO BANCO DE DADOS
                    String holeritePath = null;
                    String holeriteErrorReason = null;
                    
                    // Buscar holerite no banco de dados
                    final String cleanEmployeeName = cleanText(employeeName);
                    String normalizedSearchNameHolerite = normalizeNameForSearch(cleanEmployeeName);
                    
                    // Buscar holerites no banco para o perÃ­odo
                    List<Payslip> payslipsInDb = payslipService.getAllPayslips().stream()
                        .filter(p -> p.getMonth() != null && p.getMonth().equals(month))
                        .filter(p -> p.getYear() != null && p.getYear().equals(year))
                        .collect(java.util.stream.Collectors.toList());
                    
                    Payslip matchingPayslip = null;
                    for (Payslip p : payslipsInDb) {
                        if (p.getEmployeeName() != null) {
                            String normalizedPayslipName = normalizeNameForSearch(p.getEmployeeName());
                            boolean exactMatch = normalizedPayslipName.equals(normalizedSearchNameHolerite);
                            boolean containsMatch = normalizedPayslipName.contains(normalizedSearchNameHolerite) || 
                                                   normalizedSearchNameHolerite.contains(normalizedPayslipName);
                            boolean verifyMatch = verifyEmployeeNames(cleanEmployeeName, p.getEmployeeName());
                            
                            if (exactMatch || containsMatch || verifyMatch) {
                                matchingPayslip = p;
                                break;
                            }
                        }
                    }
                    
                    // Se encontrou no banco, usar o arquivoCaminho
                    if (matchingPayslip != null && matchingPayslip.getArquivoCaminho() != null) {
                        holeritePath = matchingPayslip.getArquivoCaminho();
                        Path absolutePath = Paths.get(holeritePath);
                        if (Files.exists(absolutePath)) {
                            holeritePath = absolutePath.toAbsolutePath().toString();
                        } else {
                            Path relativePath = Paths.get(System.getProperty("user.dir"), holeritePath);
                            if (Files.exists(relativePath)) {
                                holeritePath = relativePath.toAbsolutePath().toString();
                            } else {
                                holeritePath = null;
                                holeriteErrorReason = String.format("Holerite encontrado no banco mas arquivo nÃ£o existe. Caminho: %s", matchingPayslip.getArquivoCaminho());
                            }
                        }
                    }
                    
                    // Se nÃ£o encontrou no banco ou arquivo nÃ£o existe, buscar nos diretÃ³rios conhecidos
                    if (holeritePath == null || !Files.exists(Paths.get(holeritePath))) {
                        holeritePath = findHoleriteOriginalFileByNameAndPeriod(cleanEmployeeName, month, year);
                        if (holeritePath == null || !Files.exists(Paths.get(holeritePath))) {
                            holeriteErrorReason = holeriteErrorReason != null ? holeriteErrorReason : 
                                String.format("Holerite nÃ£o encontrado no banco nem nos arquivos fÃ­sicos. Total de holerites no banco para %d/%d: %d", 
                                    month, year, payslipsInDb.size());
                        }
                    }
                    
                    detail.setHoleriteFound(holeritePath != null && Files.exists(Paths.get(holeritePath)) ? "âœ… Sim" : "âŒ NÃ£o");
                    
                    if (holeritePath == null || !Files.exists(Paths.get(holeritePath))) {
                        detail.setStatus("FALHA");
                        detail.setMessage(holeriteErrorReason != null ? holeriteErrorReason : "Arquivo PDF do holerite nÃ£o encontrado");
                        result.getFailureList().add(detail);
                        result.setTotalFailed(result.getTotalFailed() + 1);
                        log.warn("âŒ Holerite nÃ£o encontrado para {} - {}/{}: {}", employeeName, month, year, holeriteErrorReason);
                        continue;
                    }
                    
                    // 4.2. Buscar comprovantes para o funcionÃ¡rio usando mÃºltiplas estratÃ©gias
                    // ESTRATÃ‰GIA MELHORADA: Primeiro buscar por PERÃODO, depois verificar NOME
                    // Isso resolve o problema onde o comprovante existe mas o nome pode ter pequenas diferenÃ§as
                    String normalizedEmployeeName = normalizeNameForSearch(employeeName);
                    log.info("ðŸ” Buscando comprovantes para '{}' (normalizado: '{}')", employeeName, normalizedEmployeeName);
                    
                    // REGRA DE NEGÃ“CIO: O comprovante de pagamento pode ser do mÃªs SEGUINTE ou do MESMO mÃªs
                    // Ex: Holerite de setembro -> Comprovante de outubro (mÃªs do pagamento) OU setembro
                    int receiptMonthNext = month == 12 ? 1 : month + 1;
                    int receiptYearNext = month == 12 ? year + 1 : year;
                    
                    log.info("ðŸ” Buscando comprovante para holerite {}/{} -> tentando comprovante {}/{} (mÃªs seguinte) ou {}/{} (mesmo mÃªs)", 
                        month, year, receiptMonthNext, receiptYearNext, month, year);
                    
                    // OTIMIZAÃ‡ÃƒO: Usar cache prÃ©-carregado de comprovantes
                    List<PaymentReceipt> receiptsInPeriod = new ArrayList<>();
                    
                    // Tentativa 1: MÃªs seguinte (pagamento tÃ­pico)
                    String keyNext = receiptMonthNext + "_" + receiptYearNext;
                    List<PaymentReceipt> receiptsNextMonth = receiptsByPeriod.getOrDefault(keyNext, new ArrayList<>());
                    log.info("ðŸ“‹ Encontrados {} comprovante(s) no cache para o perÃ­odo {}/{} (mÃªs seguinte)", 
                        receiptsNextMonth.size(), receiptMonthNext, receiptYearNext);
                    receiptsInPeriod.addAll(receiptsNextMonth);
                    
                    // Tentativa 2: Mesmo mÃªs (fallback)
                    String keySame = month + "_" + year;
                    List<PaymentReceipt> receiptsSameMonth = receiptsByPeriod.getOrDefault(keySame, new ArrayList<>());
                    log.info("ðŸ“‹ Encontrados {} comprovante(s) no cache para o perÃ­odo {}/{} (mesmo mÃªs)", 
                        receiptsSameMonth.size(), month, year);
                    // Adicionar apenas os que nÃ£o estÃ£o na lista do mÃªs seguinte
                    Set<UUID> existingIds = receiptsInPeriod.stream()
                        .map(PaymentReceipt::getId)
                        .collect(Collectors.toSet());
                    for (PaymentReceipt receipt : receiptsSameMonth) {
                        if (!existingIds.contains(receipt.getId())) {
                            receiptsInPeriod.add(receipt);
                        }
                    }
                    
                    log.info("ðŸ“Š Total de comprovantes no perÃ­odo: {} ({} do mÃªs seguinte + {} do mesmo mÃªs)", 
                        receiptsInPeriod.size(), receiptsNextMonth.size(), receiptsSameMonth.size());
                    
                    // ESTRATÃ‰GIA 2: Verificar se algum comprovante do perÃ­odo corresponde ao nome do funcionÃ¡rio
                    // REGRA DE NEGÃ“CIO: Comparar Nome, Valor LÃ­quido e Conta Corrente (quando disponÃ­vel)
                    // NOVA ESTRATÃ‰GIA: Usar o nome da conta creditada do comprovante e verificar no PDF do holerite
                    // se esse nome aparece na mesma linha do cÃ³digo e CPF
                    List<PaymentReceipt> matchedByName = new ArrayList<>();
                    
                    // OTIMIZAÃ‡ÃƒO: Buscar funcionÃ¡rio no cache prÃ©-carregado (mais rÃ¡pido)
                    Employee employee = null;
                    if (payslip.getCpf() != null) {
                        String normalizedCpf = normalizeCpf(payslip.getCpf());
                        employee = employeesByCpf.get(normalizedCpf);
                        if (employee != null) {
                            log.debug("âœ… Employee encontrado por CPF no cache: {} (ID: {})", employee.getName(), employee.getId());
                        }
                    }
                    if (employee == null && employeeName != null && !employeeName.trim().isEmpty()) {
                        String normalizedEmployeeNameForCache = normalizeNameForSearch(employeeName);
                        employee = employeesByName.get(normalizedEmployeeNameForCache);
                        if (employee != null) {
                            log.debug("âœ… Employee encontrado por nome no cache: {} (ID: {})", employee.getName(), employee.getId());
                        }
                    }
                    // Fallback: buscar via mÃ©todo tradicional se nÃ£o encontrou no cache
                    if (employee == null) {
                        employee = findEmployeeForPayslip(payslip);
                    }
                    if (employee != null) {
                        log.info("âœ… FuncionÃ¡rio encontrado na tabela employees: {} (ID: {}, CPF: {}, Conta: {})", 
                            employee.getName(), employee.getId(), 
                            employee.getDocument() != null ? employee.getDocument() : "N/A",
                            employee.getContaCorrente() != null ? employee.getContaCorrente() : "N/A");
                    }
                    
                    // Primeiro, tentar buscar usando o nome da conta creditada do comprovante
                    for (PaymentReceipt receipt : receiptsInPeriod) {
                        if (receipt.getEmployeeName() == null && receipt.getCreditedName() == null) {
                            continue;
                        }
                        
                        // Usar o nome da conta creditada (que pode estar abreviado) ou o nome do funcionÃ¡rio
                        String receiptName = receipt.getCreditedName() != null ? receipt.getCreditedName() : receipt.getEmployeeName();
                        
                        // Verificar no PDF do holerite se o nome do comprovante aparece na mesma linha do cÃ³digo e CPF
                        Payslip matchedPayslip = findPayslipByReceiptNameInPDF(receiptName, List.of(payslip));
                        
                        boolean nameMatches = false;
                        boolean cpfMatches = false;
                        boolean valueMatches = false;
                        boolean accountMatches = false;
                        
                        // 1. VERIFICAR NOME
                        if (matchedPayslip != null) {
                            nameMatches = true;
                            log.debug("âœ… Comprovante '{}' corresponde ao holerite '{}' (verificado no PDF)", 
                                receiptName, payslip.getEmployeeName());
                        } else {
                            // Fallback: verificar usando estratÃ©gias tradicionais de matching
                            boolean exactMatch = verifyEmployeeNames(employeeName, receipt.getEmployeeName());
                            boolean flexibleMatch = isFlexibleNameMatch(employeeName, receipt.getEmployeeName());
                            String receiptNormalizedName = normalizeNameForSearch(receipt.getEmployeeName());
                            boolean normalizedMatch = receiptNormalizedName.contains(normalizedEmployeeName) || 
                                normalizedEmployeeName.contains(receiptNormalizedName);
                            
                            nameMatches = exactMatch || flexibleMatch || normalizedMatch;
                        }
                        
                        // 2. VERIFICAR CPF (prioridade alta para matching preciso)
                        if (payslip.getCpf() != null) {
                            String payslipCpf = normalizeCpf(payslip.getCpf());
                            if (!payslipCpf.isEmpty()) {
                                // Verificar CPF do employee se disponÃ­vel
                                if (employee != null && employee.getDocument() != null) {
                                    String employeeCpf = normalizeCpf(employee.getDocument());
                                    if (payslipCpf.equals(employeeCpf)) {
                                        // Se o receipt tem employeeId, verificar se corresponde
                                        if (receipt.getEmployeeId() != null && receipt.getEmployeeId().equals(employee.getId())) {
                                            cpfMatches = true;
                                            log.debug("âœ… CPF corresponde (via employeeId do receipt): {}", payslipCpf);
                                        } else {
                                            // Verificar se o receipt pertence a um employee com mesmo CPF
                                            cpfMatches = true; // Se o employee tem o CPF, assume match
                                            log.debug("âœ… CPF corresponde (via employee): {}", payslipCpf);
                                        }
                                    }
                                }
                            }
                        }
                        
                        // 3. VERIFICAR VALOR (Valor LÃ­quido do Holerite vs Valor do Comprovante)
                        if (payslip.getNetValue() != null && receipt.getNetSalary() != null) {
                            valueMatches = payslip.getNetValue().compareTo(receipt.getNetSalary()) == 0;
                        }
                        
                        // 4. VERIFICAR CONTA CORRENTE USANDO TABELA EMPLOYEES (quando nÃ£o tiver no holerite)
                        // PRIORIDADE: Se nÃ£o encontrou match de conta corrente no holerite, buscar na tabela employees
                        if (employee != null && employee.getContaCorrente() != null && receipt.getCreditedAccount() != null) {
                            String employeeAccount = normalizeAccountNumber(employee.getContaCorrente());
                            String receiptAccount = normalizeAccountNumber(receipt.getCreditedAccount());
                            accountMatches = employeeAccount.equals(receiptAccount);
                            
                            if (accountMatches) {
                                log.debug("âœ… Conta corrente corresponde (via tabela employees): '{}' = '{}'", 
                                    employeeAccount, receiptAccount);
                            }
                        }
                        
                        // REGRA DE NEGÃ“CIO MELHORADA: Match se (Nome OU CPF) E Valor correspondem
                        // Conta Corrente Ã© usado para validaÃ§Ã£o adicional quando disponÃ­vel
                        boolean basicMatch = (nameMatches || cpfMatches) && valueMatches;
                        
                        if (basicMatch) {
                            // Se conta corrente foi verificada e nÃ£o corresponde, dar aviso mas ainda fazer match
                            // (conta corrente Ã© validaÃ§Ã£o adicional, nÃ£o bloqueante)
                            if (accountMatches) {
                                matchedByName.add(receipt);
                                log.info("âœ… Comprovante adicionado ao match - Nome: {}, CPF: {}, Valor: {}, Conta: âœ…", 
                                    nameMatches, cpfMatches, valueMatches);
                            } else if (receipt.getCreditedAccount() == null || employee == null || employee.getContaCorrente() == null) {
                                // Se nÃ£o tem conta corrente para verificar, fazer match mesmo assim
                                matchedByName.add(receipt);
                                log.info("âœ… Comprovante adicionado ao match - Nome: {}, CPF: {}, Valor: {}, Conta: N/A", 
                                    nameMatches, cpfMatches, valueMatches);
                            } else {
                                // Conta corrente foi verificada e nÃ£o corresponde - avisar mas ainda fazer match
                                matchedByName.add(receipt);
                                log.warn("âš ï¸ Comprovante adicionado com AVISO - Nome: {}, CPF: {}, Valor: {}, Conta: âŒ (nÃ£o corresponde)", 
                                    nameMatches, cpfMatches, valueMatches);
                            }
                        } else {
                            log.debug("   Match nÃ£o encontrado - Nome: {}, CPF: {}, Valor: {}", 
                                nameMatches, cpfMatches, valueMatches);
                        }
                    }
                    
                    log.info("ðŸ“‹ Comprovantes apÃ³s filtro de nome: {} (de {} no perÃ­odo)", 
                        matchedByName.size(), receiptsInPeriod.size());
                    
                    // ESTRATÃ‰GIA 3: Se nÃ£o encontrou no perÃ­odo, buscar TODOS os comprovantes do funcionÃ¡rio (sem restriÃ§Ã£o de perÃ­odo)
                    if (matchedByName.isEmpty()) {
                        log.warn("âš ï¸ Nenhum comprovante encontrado no perÃ­odo. Buscando em TODOS os comprovantes do funcionÃ¡rio...");
                        
                        // Buscar por nome completo
                        List<PaymentReceipt> receiptsByName = receiptRepository
                            .findByEmployeeNameContainingIgnoreCase(employeeName);
                        log.info("ðŸ“‹ Encontrados {} comprovante(s) por nome completo '{}'", receiptsByName.size(), employeeName);
                        
                        // Buscar por partes do nome (primeiro e Ãºltimo nome)
                        if (employeeName != null && !employeeName.trim().isEmpty()) {
                            String[] nameParts = employeeName.trim().toUpperCase().split("\\s+");
                            if (nameParts.length >= 2) {
                                String firstName = nameParts[0];
                                String lastName = nameParts[nameParts.length - 1];
                                log.info("ðŸ” Buscando por primeiro nome '{}' e Ãºltimo nome '{}'", firstName, lastName);
                                
                                List<PaymentReceipt> receiptsByFirst = receiptRepository
                                    .findByEmployeeNameContainingIgnoreCase(firstName);
                                for (PaymentReceipt receipt : receiptsByFirst) {
                                    if (receipt.getEmployeeName() != null && 
                                        receipt.getEmployeeName().toUpperCase().contains(lastName)) {
                                        if (!receiptsByName.contains(receipt)) {
                                            receiptsByName.add(receipt);
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Filtrar por matching de nome usando verificaÃ§Ã£o no PDF do holerite
                        matchedByName = new ArrayList<>();
                        for (PaymentReceipt receipt : receiptsByName) {
                            if (receipt.getEmployeeName() == null && receipt.getCreditedName() == null) {
                                continue;
                            }
                            
                            // Usar o nome da conta creditada (que pode estar abreviado) ou o nome do funcionÃ¡rio
                            String receiptName = receipt.getCreditedName() != null ? receipt.getCreditedName() : receipt.getEmployeeName();
                            
                            // Verificar no PDF do holerite se o nome do comprovante aparece na mesma linha do cÃ³digo e CPF
                            Payslip matchedPayslip = findPayslipByReceiptNameInPDF(receiptName, List.of(payslip));
                            
                            if (matchedPayslip != null) {
                                matchedByName.add(receipt);
                                log.info("âœ… Comprovante '{}' corresponde ao holerite '{}' (verificado no PDF, sem restriÃ§Ã£o de perÃ­odo)", 
                                    receiptName, payslip.getEmployeeName());
                            } else {
                                // Fallback: verificar usando estratÃ©gias tradicionais de matching
                                boolean exactMatch = verifyEmployeeNames(employeeName, receipt.getEmployeeName());
                                boolean flexibleMatch = isFlexibleNameMatch(employeeName, receipt.getEmployeeName());
                                String receiptNormalizedNameForMatch = normalizeNameForSearch(receipt.getEmployeeName());
                                boolean normalizedMatch = receiptNormalizedNameForMatch.contains(normalizedEmployeeName) || 
                                    normalizedEmployeeName.contains(receiptNormalizedNameForMatch);
                                
                                if (exactMatch || flexibleMatch || normalizedMatch) {
                                    matchedByName.add(receipt);
                                }
                            }
                        }
                        
                        log.info("ðŸ“‹ Comprovantes encontrados por nome (sem restriÃ§Ã£o de perÃ­odo): {}", matchedByName.size());
                        
                        if (!matchedByName.isEmpty()) {
                            log.warn("âš ï¸ Encontrados {} comprovante(s) do funcionÃ¡rio, mas em perÃ­odo diferente do esperado:", matchedByName.size());
                            matchedByName.forEach(r -> log.warn("     - {}: {}/{} (esperado: {}/{} ou {}/{})", 
                                r.getEmployeeName(), r.getMonth(), r.getYear(), 
                                receiptMonthNext, receiptYearNext, month, year));
                        }
                    }
                    
                    List<PaymentReceipt> uniqueReceipts = deduplicateReceiptsByDateCompanyAndEmployee(matchedByName);
                    if (matchedByName.size() != uniqueReceipts.size()) {
                        log.info("â™»ï¸ Removidos {} comprovante(s) duplicado(s) para {} {}/{} com base em data/nome/empresa",
                            matchedByName.size() - uniqueReceipts.size(), employeeName, month, year);
                    }
                    
                    detail.setReceiptFound(uniqueReceipts.isEmpty() ? "âŒ NÃ£o" : "âœ… Sim (" + uniqueReceipts.size() + ")");
                    
                    if (uniqueReceipts.isEmpty()) {
                        // Construir mensagem de erro detalhada
                        StringBuilder errorMsg = new StringBuilder();
                        errorMsg.append("Comprovante nÃ£o encontrado. ");
                        
                        if (receiptsInPeriod.isEmpty()) {
                            errorMsg.append(String.format("Nenhum comprovante no banco para o perÃ­odo %d/%d (mÃªs seguinte) ou %d/%d (mesmo mÃªs). ", 
                                receiptMonthNext, receiptYearNext, month, year));
                        } else {
                            errorMsg.append(String.format("Encontrados %d comprovante(s) no banco para o perÃ­odo %d/%d ou %d/%d, mas nenhum corresponde ao nome '%s'. ", 
                                receiptsInPeriod.size(), receiptMonthNext, receiptYearNext, month, year, employeeName));
                            
                            // Listar os comprovantes encontrados no perÃ­odo
                            List<PaymentReceipt> receiptsToShow = receiptsInPeriod.size() <= 5 ? receiptsInPeriod : receiptsInPeriod.subList(0, 5);
                            errorMsg.append(receiptsInPeriod.size() <= 5 ? "Comprovantes encontrados: " : "Primeiros 5 comprovantes: ");
                            for (int i = 0; i < receiptsToShow.size(); i++) {
                                PaymentReceipt r = receiptsToShow.get(i);
                                if (i > 0) errorMsg.append(", ");
                                errorMsg.append(String.format("%s (%d/%d)", 
                                    r.getEmployeeName() != null ? r.getEmployeeName() : "N/A", 
                                    r.getMonth(), r.getYear()));
                            }
                            if (receiptsInPeriod.size() > 5) {
                                errorMsg.append(String.format(" e mais %d...", receiptsInPeriod.size() - 5));
                            }
                        }
                        
                        // Log detalhado para debug
                        log.warn("âŒ Nenhum comprovante encontrado para {} - {}/{}", employeeName, month, year);
                        log.warn("   Tentou buscar no perÃ­odo {}/{} (mÃªs seguinte) e {}/{} (mesmo mÃªs)", 
                            receiptMonthNext, receiptYearNext, month, year);
                        log.warn("   Total de comprovantes no perÃ­odo: {}", receiptsInPeriod.size());
                        if (!receiptsInPeriod.isEmpty()) {
                            log.warn("   Comprovantes encontrados no perÃ­odo (mas nomes nÃ£o correspondem):");
                            receiptsInPeriod.forEach(r -> log.warn("     - {}: {}/{}", 
                                r.getEmployeeName(), r.getMonth(), r.getYear()));
                        }
                        
                        detail.setStatus("FALHA");
                        detail.setMessage(errorMsg.toString());
                        result.getFailureList().add(detail);
                        result.setTotalFailed(result.getTotalFailed() + 1);
                        continue;
                    }
                    
                    // 4.3. Verificar se os nomes coincidem (VALIDAÃ‡ÃƒO CRÃTICA) - usando verificaÃ§Ã£o flexÃ­vel
                    boolean allNamesMatch = uniqueReceipts.stream()
                        .allMatch(receipt -> verifyEmployeeNames(employeeName, receipt.getEmployeeName()));
                    
                    detail.setNamesMatch(allNamesMatch);
                    
                    if (!allNamesMatch && (request.getForceUnification() == null || !request.getForceUnification())) {
                        detail.setStatus("FALHA");
                        detail.setMessage("Nomes nÃ£o coincidem - Holerite: '" + employeeName + "' vs Comprovante(s): " + 
                            uniqueReceipts.stream()
                                .map(PaymentReceipt::getEmployeeName)
                                .distinct()
                                .collect(Collectors.joining(", ", "'", "'")));
                        result.getFailureList().add(detail);
                        result.setTotalFailed(result.getTotalFailed() + 1);
                        log.warn("âŒ NOMES NÃƒO COINCIDEM para {} - {}/{}", employeeName, month, year);
                        continue;
                    }
                    
                    // 4.4. Buscar arquivos PDF dos comprovantes
                    // ESTRATÃ‰GIA MELHORADA: Tentar mÃºltiplos perÃ­odos e pastas
                    List<String> receiptPaths = new ArrayList<>();
                    java.util.List<String> searchedPaths = new java.util.ArrayList<>();
                    
                    for (PaymentReceipt receipt : uniqueReceipts) {
                        java.util.List<String> receiptSearchedPaths = new java.util.ArrayList<>();
                        String receiptPath = null;
                        
                        // Tentativa 1: Usar o mÃªs/ano do comprovante encontrado no banco
                        receiptPath = findReceiptOriginalFileByNameAndPeriod(
                            receipt.getEmployeeName(), 
                            receipt.getMonth(),
                            receipt.getYear(),
                            receiptSearchedPaths
                        );
                        
                        // Tentativa 2: Se nÃ£o encontrou, tentar mÃªs seguinte (caso o arquivo esteja em outra pasta)
                        if ((receiptPath == null || !Files.exists(Paths.get(receiptPath))) && receipt.getMonth() != null) {
                            int nextMonth = receipt.getMonth() == 12 ? 1 : receipt.getMonth() + 1;
                            int nextYear = receipt.getMonth() == 12 ? receipt.getYear() + 1 : receipt.getYear();
                            log.info("ðŸ” Tentativa 2: Buscando comprovante no mÃªs seguinte {}/{}", nextMonth, nextYear);
                            receiptPath = findReceiptOriginalFileByNameAndPeriod(
                                receipt.getEmployeeName(),
                                nextMonth,
                                nextYear,
                                receiptSearchedPaths
                            );
                        }
                        
                        // Tentativa 3: Se ainda nÃ£o encontrou, tentar mÃªs anterior
                        if ((receiptPath == null || !Files.exists(Paths.get(receiptPath))) && receipt.getMonth() != null) {
                            int prevMonth = receipt.getMonth() == 1 ? 12 : receipt.getMonth() - 1;
                            int prevYear = receipt.getMonth() == 1 ? receipt.getYear() - 1 : receipt.getYear();
                            log.info("ðŸ” Tentativa 3: Buscando comprovante no mÃªs anterior {}/{}", prevMonth, prevYear);
                            receiptPath = findReceiptOriginalFileByNameAndPeriod(
                                receipt.getEmployeeName(),
                                prevMonth,
                                prevYear,
                                receiptSearchedPaths
                            );
                        }
                        
                        // Tentativa 4: Buscar apenas pelo nome, sem perÃ­odo (Ãºltima tentativa)
                        if (receiptPath == null || !Files.exists(Paths.get(receiptPath))) {
                            log.info("ðŸ” Tentativa 4: Buscando comprovante apenas pelo nome (sem perÃ­odo)");
                            receiptPath = findReceiptOriginalFileByNameOnly(receipt.getEmployeeName(), receiptSearchedPaths);
                        }
                        
                        if (receiptPath != null && Files.exists(Paths.get(receiptPath))) {
                            receiptPaths.add(receiptPath);
                            log.info("âœ… Comprovante PDF encontrado: {}", receiptPath);
                        } else {
                            log.warn("âš ï¸ Comprovante PDF nÃ£o encontrado apÃ³s todas as tentativas: {}", receipt.getFileName());
                            searchedPaths.addAll(receiptSearchedPaths);
                        }
                    }
                    
                    if (receiptPaths.isEmpty()) {
                        detail.setStatus("FALHA");
                        
                        // Construir mensagem detalhada explicando o problema
                        int receiptMonth = month == 12 ? 1 : month + 1;
                        int receiptYear = month == 12 ? year + 1 : year;
                        
                        StringBuilder errorMsg = new StringBuilder();
                        errorMsg.append("Nenhum comprovante encontrado para o perÃ­odo ").append(receiptMonth).append("/").append(receiptYear);
                        errorMsg.append(" (mÃªs seguinte ao holerite ").append(month).append("/").append(year).append(").\n\n");
                        errorMsg.append("O sistema procurou os arquivos PDF nas seguintes pastas:\n");
                        if (searchedPaths.isEmpty()) {
                            // Listar as pastas padrÃ£o que seriam verificadas
                            errorMsg.append("â€¢ uploads/receipts/").append(String.format("%02d_%04d", receiptMonth, receiptYear)).append("\n");
                            errorMsg.append("â€¢ uploads/receipts/").append(receiptMonth).append("_").append(receiptYear).append("\n");
                            errorMsg.append("â€¢ uploads/payment-receipts/").append(receiptYear).append("/").append(String.format("%02d", receiptMonth)).append("\n");
                            errorMsg.append("â€¢ uploads/receipts/\n");
                        } else {
                            for (String path : searchedPaths) {
                                errorMsg.append("â€¢ ").append(path).append("\n");
                            }
                        }
                        errorMsg.append("\n");
                        errorMsg.append("POSSÃVEIS CAUSAS:\n");
                        errorMsg.append("1. O comprovante ainda nÃ£o foi importado no sistema\n");
                        errorMsg.append("2. O arquivo PDF foi salvo em uma pasta diferente da esperada\n");
                        errorMsg.append("3. O nome do arquivo nÃ£o contÃ©m o nome do funcionÃ¡rio ou perÃ­odo correto\n");
                        errorMsg.append("4. O comprovante estÃ¡ no banco de dados mas o arquivo fÃ­sico foi movido ou deletado\n\n");
                        errorMsg.append("AÃ‡ÃƒO NECESSÃRIA:\n");
                        errorMsg.append("Por favor, importe o comprovante de pagamento para o funcionÃ¡rio '").append(employeeName);
                        errorMsg.append("' referente ao perÃ­odo ").append(receiptMonth).append("/").append(receiptYear);
                        errorMsg.append(" (mÃªs seguinte ao holerite).");
                        
                        detail.setMessage(errorMsg.toString());
                        result.getFailureList().add(detail);
                        result.setTotalFailed(result.getTotalFailed() + 1);
                        log.warn("âŒ PDFs dos comprovantes nÃ£o encontrados para {} - {}/{}", employeeName, month, year);
                        continue;
                    }
                    
                    // 4.5. Extrair nome do funcionÃ¡rio do holerite e do comprovante e verificar correspondÃªncia
                    String employeeNameFromPayslip = matchingPayslip != null ? matchingPayslip.getEmployeeName() : null;
                    String employeeNameFromReceipt = null;
                    
                    // Usar o primeiro receipt da lista para extrair o nome
                    PaymentReceipt firstReceipt = uniqueReceipts.isEmpty() ? null : uniqueReceipts.get(0);
                    if (firstReceipt != null) {
                        employeeNameFromReceipt = firstReceipt.getCreditedName() != null ? 
                            firstReceipt.getCreditedName() : firstReceipt.getEmployeeName();
                    }
                    
                    // Se nÃ£o temos os nomes dos objetos, tentar extrair dos PDFs
                    if (employeeNameFromPayslip == null) {
                        employeeNameFromPayslip = extractEmployeeNameFromPayslipPDF(holeritePath);
                    }
                    if (employeeNameFromReceipt == null && !receiptPaths.isEmpty()) {
                        employeeNameFromReceipt = extractEmployeeNameFromReceiptPDF(receiptPaths.get(0));
                    }
                    
                    // Verificar correspondÃªncia e usar nome do holerite (completo)
                    String finalEmployeeName = employeeName;
                    if (employeeNameFromPayslip != null && employeeNameFromReceipt != null) {
                        boolean namesMatch = verifyEmployeeNames(employeeNameFromPayslip, employeeNameFromReceipt);
                        if (namesMatch) {
                            finalEmployeeName = employeeNameFromPayslip;
                            log.info("âœ… Nomes correspondem! Usando nome do holerite: '{}'", finalEmployeeName);
                        } else {
                            log.warn("âš ï¸ Nomes nÃ£o correspondem. Usando nome original: '{}'", finalEmployeeName);
                        }
                    } else if (employeeNameFromPayslip != null) {
                        finalEmployeeName = employeeNameFromPayslip;
                        log.info("âœ… Usando nome do holerite: '{}'", finalEmployeeName);
                    }
                    
                    // Criar documento unificado usando PDFMergerUtility
                    String unifiedPath = createUnifiedPdfUsingMerger(
                        holeritePath, 
                        receiptPaths, 
                        finalEmployeeName, 
                        month, 
                        year,
                        matchingPayslip,
                        firstReceipt  // Usar o primeiro receipt da lista
                    );
                    
                    detail.setStatus("SUCESSO");
                    detail.setMessage(allNamesMatch ? 
                        "Documento unificado criado com sucesso" : 
                        "Documento criado com AVISO: nomes nÃ£o coincidem exatamente");
                    detail.setFilePath(unifiedPath);
                    result.getSuccessList().add(detail);
                    result.setTotalSuccess(result.getTotalSuccess() + 1);
                    
                    log.info("âœ… Documento unificado criado: {}", unifiedPath);
                    
                } catch (Exception e) {
                    detail.setStatus("ERRO");
                    detail.setMessage("Erro ao processar: " + e.getMessage());
                    result.getFailureList().add(detail);
                    result.setTotalFailed(result.getTotalFailed() + 1);
                    log.error("ðŸ’¥ Erro ao processar {} - {}/{}: {}", employeeName, month, year, e.getMessage(), e);
                }
            }
            
            long endTime = System.currentTimeMillis();
            result.setProcessingTimeMs(endTime - startTime);
            
            log.info("=== âœ… UNIFICAÃ‡ÃƒO EM LOTE CONCLUÃDA ===");
            log.info("Total processado: {}", result.getTotalProcessed());
            log.info("Total sucesso: {}", result.getTotalSuccess());
            log.info("Total falhas: {}", result.getTotalFailed());
            log.info("Tempo de processamento: {} ms", result.getProcessingTimeMs());
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro crÃ­tico na unificaÃ§Ã£o em lote: {}", e.getMessage(), e);
            result.setTotalFailed(result.getTotalProcessed());
        }
        
        return result;
    }
    
    /**
     * Remove comprovantes duplicados considerando data, funcionÃ¡rio e empresa
     */
    private List<PaymentReceipt> deduplicateReceiptsByDateCompanyAndEmployee(List<PaymentReceipt> receipts) {
        if (receipts == null || receipts.isEmpty()) {
            return Collections.emptyList();
        }

        Map<String, PaymentReceipt> uniqueReceipts = new LinkedHashMap<>();

        for (PaymentReceipt receipt : receipts) {
            if (receipt == null) {
                continue;
            }

            String normalizedCompany = normalizeKeyText(receipt.getDebitedName());
            String employeeNameForKey = emptyToNull(receipt.getCreditedName());
            if (employeeNameForKey == null) {
                employeeNameForKey = emptyToNull(receipt.getEmployeeName());
            }
            String normalizedEmployee = normalizeKeyText(employeeNameForKey);
            String normalizedDate = normalizeTransferDateKey(receipt);

            boolean canDeduplicate = !normalizedCompany.isEmpty() && !normalizedEmployee.isEmpty() && !normalizedDate.isEmpty();
            String dedupKey;

            if (canDeduplicate) {
                dedupKey = normalizedDate + "|" + normalizedCompany + "|" + normalizedEmployee;
            } else {
                dedupKey = "FALLBACK-" + uniqueReceipts.size() + "-" +
                    Objects.toString(receipt.getId(), receipt.getFileName());
            }

            if (uniqueReceipts.containsKey(dedupKey)) {
                log.info("ðŸ” Ignorando comprovante duplicado (chave {}): {}", dedupKey, receipt.getFileName());
                continue;
            }

            uniqueReceipts.put(dedupKey, receipt);
        }

        return new ArrayList<>(uniqueReceipts.values());
    }

    private String normalizeKeyText(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return "";
        }
        String normalized = Normalizer.normalize(trimmed, Normalizer.Form.NFD)
            .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "")
            .replaceAll("\\s+", " ")
            .toUpperCase();
        return normalized.trim();
    }

    private String normalizeTransferDateKey(PaymentReceipt receipt) {
        if (receipt.getTransferDate() != null && !receipt.getTransferDate().isBlank()) {
            return receipt.getTransferDate().replaceAll("[^0-9]", "");
        }
        if (receipt.getPaymentDate() != null) {
            return receipt.getPaymentDate().toLocalDate().format(DateTimeFormatter.BASIC_ISO_DATE);
        }
        return "";
    }

    private String emptyToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /**
     * Cria PDF unificado usando PDFMergerUtility para preservar layout original
     * O nome do arquivo serÃ¡ baseado no nome do funcionÃ¡rio extraÃ­do do holerite (completo)
     */
    private String createUnifiedPdfUsingMerger(String holeritePath, List<String> receiptPaths, 
                                               String employeeName, int month, int year,
                                               Payslip payslip, PaymentReceipt receipt) throws IOException {
        // Criar diretÃ³rio se nÃ£o existir
        Path unifiedDir = Paths.get(UNIFIED_DIR, "expanded").toAbsolutePath();
        if (!Files.exists(unifiedDir)) {
            Files.createDirectories(unifiedDir);
        }
        
        // Extrair CPF do nome do arquivo do holerite
        String cpf = "";
        String holeriteFileName = Paths.get(holeritePath).getFileName().toString();
        java.util.regex.Pattern cpfPattern = java.util.regex.Pattern.compile("(\\d{11})");
        java.util.regex.Matcher cpfMatcher = cpfPattern.matcher(holeriteFileName);
        if (cpfMatcher.find()) {
            cpf = cpfMatcher.group(1);
            log.info("âœ… CPF extraÃ­do do holerite: {}", cpf);
        } else {
            log.warn("âš ï¸ CPF nÃ£o encontrado no nome do holerite: {}", holeriteFileName);
        }
        
        // Nome do arquivo unificado (SEM prefixo "UNIFICADO" - removido conforme solicitado)
        String cleanName = employeeName.replaceAll("[^a-zA-ZÃ€-Ã¿0-9\\s]", "").replaceAll("\\s+", "_");
        String fileName;
        if (!cpf.isEmpty()) {
            fileName = String.format("%s_%s_%d_%d.pdf", cleanName.toUpperCase(), cpf, month, year);
            log.info("ðŸ“„ Nome do arquivo unificado COM CPF: {}", fileName);
        } else {
            fileName = String.format("%s_%d_%d.pdf", cleanName.toUpperCase(), month, year);
            log.info("ðŸ“„ Nome do arquivo unificado SEM CPF: {}", fileName);
        }
        String outputPath = unifiedDir.resolve(fileName).toString();
        
        log.info("ðŸ”„ Criando PDF unificado: {}", outputPath);
        log.info("ðŸ“„ Holerite: {}", holeritePath);
        log.info("ðŸ“„ Comprovantes: {}", receiptPaths.size());
        
        try {
            // Usar PDFMergerUtility para manter layout original
            org.apache.pdfbox.multipdf.PDFMergerUtility merger = new org.apache.pdfbox.multipdf.PDFMergerUtility();
            merger.setDestinationFileName(outputPath);
            
            // Adicionar holerite primeiro
            merger.addSource(new File(holeritePath));
            log.info("âœ… Holerite adicionado ao merge");
            
            // Adicionar todos os comprovantes
            for (String receiptPath : receiptPaths) {
                merger.addSource(new File(receiptPath));
                log.info("âœ… Comprovante adicionado: {}", Paths.get(receiptPath).getFileName());
            }
            
            // Executar merge
            merger.mergeDocuments(null);
            log.info("âœ… Merge concluÃ­do: {}", outputPath);
            
            // Verificar se foi criado
            File outputFile = new File(outputPath);
            if (outputFile.exists()) {
                log.info("âœ… Arquivo verificado: {} bytes", outputFile.length());
                
                // Salvar no banco de dados
                try {
                    // Usar os payslip e receipt passados como parÃ¢metros, ou buscar se nÃ£o foram fornecidos
                    Payslip payslipToSave = payslip;
                    PaymentReceipt receiptToSave = receipt;
                    Employee employee = null;
                    
                    // Se payslip ou receipt nÃ£o foram fornecidos, buscar no banco
                    if (payslipToSave == null) {
                        List<Payslip> payslips = payslipService.getAllPayslips();
                        for (Payslip p : payslips) {
                            if (p.getMonth() != null && p.getMonth().equals(month) &&
                                p.getYear() != null && p.getYear().equals(year) &&
                                p.getEmployeeName() != null) {
                                if (verifyEmployeeNames(employeeName, p.getEmployeeName())) {
                                    payslipToSave = p;
                                    log.info("âœ… Payslip encontrado para documento unificado: {} - {}/{}", 
                                        employeeName, month, year);
                                    break;
                                }
                            }
                        }
                    }
                    
                    if (receiptToSave == null) {
                        int receiptMonth = month == 12 ? 1 : month + 1;
                        int receiptYear = month == 12 ? year + 1 : year;
                        List<PaymentReceipt> receipts = receiptRepository.findAll();
                        for (PaymentReceipt r : receipts) {
                            if (r.getEmployeeName() != null && 
                                verifyEmployeeNames(employeeName, r.getEmployeeName()) &&
                                r.getMonth() != null && r.getMonth().equals(receiptMonth) &&
                                r.getYear() != null && r.getYear().equals(receiptYear)) {
                                receiptToSave = r;
                                break;
                            }
                        }
                    }
                    
                    // Buscar employee por CPF se disponÃ­vel
                    if (payslipToSave != null && payslipToSave.getCpf() != null) {
                        employee = employeeRepository.findByCpf(payslipToSave.getCpf()).orElse(null);
                    }
                    
                    // Criar e salvar UnifiedDocument
                    UnifiedDocument unifiedDoc = UnifiedDocument.builder()
                        .employee(employee)
                        .payslip(payslipToSave)
                        .receipt(receiptToSave)
                        .employeeName(employeeName)
                        .month(month)
                        .year(year)
                        .fileName(fileName)
                        .filePath(outputPath)
                        .fileSize(outputFile.length())
                        .status(UnifiedDocument.UnifiedDocumentStatus.PROCESSED)
                        .build();
                    
                    unifiedDocumentRepository.save(unifiedDoc);
                    log.info("âœ… Documento unificado salvo no banco de dados: ID={}", unifiedDoc.getId());
                    
                } catch (Exception dbError) {
                    log.warn("âš ï¸ Erro ao salvar documento unificado no banco de dados: {}", dbError.getMessage());
                    // NÃ£o falhar a criaÃ§Ã£o do arquivo se houver erro ao salvar no banco
                }
                
                return outputPath;
            } else {
                throw new IOException("Arquivo unificado nÃ£o foi criado");
            }
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao criar PDF unificado: {}", e.getMessage(), e);
            throw new IOException("Erro ao unificar PDFs: " + e.getMessage(), e);
        }
    }

    /**
     * MÃ©todo de teste para verificar se os serviÃ§os estÃ£o funcionando
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
            result.put("message", "ServiÃ§os testados com sucesso");
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao testar serviÃ§os: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }

    /**
     * Organiza documentos unificados por Empresa/Setor/Ano/MÃªs
     * VERSÃƒO OTIMIZADA: Usa queries eficientes e evita carregar dados desnecessÃ¡rios
     */
    @Transactional(readOnly = true)
    public PayslipOrganizationResponse organizeUnifiedDocumentsByCompany() {
        long startTime = System.currentTimeMillis();
        PayslipOrganizationResponse response = new PayslipOrganizationResponse();
        response.setGeneratedAt(LocalDateTime.now());
        
        // Timeout de seguranÃ§a: mÃ¡ximo 25 segundos
        long maxExecutionTime = 25000;

        try {
            log.info("âš¡ [OTIMIZADO] Iniciando organizaÃ§Ã£o de documentos unificados...");
            
            // Verificar timeout periodicamente
            if (System.currentTimeMillis() - startTime > maxExecutionTime) {
                log.warn("â±ï¸ Timeout detectado antes de iniciar processamento");
                response.setTotalPayslips(0);
                response.setCompanies(Collections.emptyList());
                response.setTotalCompanies(0);
                response.setTotalSectors(0);
                return response;
            }
            
            // OTIMIZAÃ‡ÃƒO 1: Buscar unified documents do banco (limitado para evitar travamento)
            List<UnifiedDocument> unifiedDocumentsFromDb;
            try {
                unifiedDocumentsFromDb = unifiedDocumentRepository.findAllWithPayslipOptimized();
                
                // Limitar a 2000 registros para evitar travamento e respostas muito grandes
                if (unifiedDocumentsFromDb.size() > 2000) {
                    log.warn("âš ï¸ Muitos documentos unificados ({}) encontrados. Limitando a 2000 para performance e evitar travamento do navegador.", unifiedDocumentsFromDb.size());
                    unifiedDocumentsFromDb = unifiedDocumentsFromDb.subList(0, 2000);
                }
                
                log.info("ðŸ“‹ [OTIMIZADO] Encontrados {} documentos unificados no banco (limitado a 2000)", unifiedDocumentsFromDb.size());
            } catch (Exception dbError) {
                log.error("âŒ Erro ao buscar documentos unificados: {}", dbError.getMessage(), dbError);
                // Retornar resposta vazia ao invÃ©s de tentar mÃ©todo padrÃ£o que pode travar
                response.setTotalPayslips(0);
                response.setCompanies(Collections.emptyList());
                response.setTotalCompanies(0);
                response.setTotalSectors(0);
                return response;
            }
            
            if (unifiedDocumentsFromDb.isEmpty()) {
                log.info("ðŸ“‹ Nenhum documento unificado encontrado no banco, tentando listar arquivos fÃ­sicos...");
                // Fallback: tentar listar arquivos fÃ­sicos
                try {
                    List<Map<String, Object>> unifiedDocs = listAllUnifiedDocuments();
                    if (unifiedDocs.isEmpty()) {
                        response.setTotalPayslips(0);
                        response.setCompanies(Collections.emptyList());
                        response.setTotalCompanies(0);
                        response.setTotalSectors(0);
                        return response;
                    }
                    // Continuar com processamento de arquivos fÃ­sicos (cÃ³digo antigo)
                } catch (IOException e) {
                    log.error("âŒ Erro ao listar documentos unificados: {}", e.getMessage(), e);
                    response.setTotalPayslips(0);
                    response.setCompanies(Collections.emptyList());
                    response.setTotalCompanies(0);
                    response.setTotalSectors(0);
                    return response;
                }
            }

            // OTIMIZAÃ‡ÃƒO 2: Criar mapa de payslips apenas dos que estÃ£o relacionados aos unified documents
            // Isso evita carregar TODOS os payslips do banco
            Map<UUID, Payslip> payslipByIdMap = new HashMap<>();
            Set<String> payslipKeys = new HashSet<>();
            
            for (UnifiedDocument ud : unifiedDocumentsFromDb) {
                try {
                    Payslip payslip = ud.getPayslip();
                    if (payslip != null && payslip.getId() != null) {
                        payslipByIdMap.put(payslip.getId(), payslip);
                        String key = String.format("%s|%d|%d", 
                            normalizeName(payslip.getEmployeeName()), 
                            payslip.getMonth(), 
                            payslip.getYear());
                        payslipKeys.add(key);
                    }
                } catch (Exception e) {
                    log.debug("âš ï¸ Erro ao acessar payslip do unified document: {}", e.getMessage());
                }
            }
            
            log.info("ðŸ“Š [OTIMIZADO] Mapeados {} payslips Ãºnicos relacionados aos documentos unificados", payslipByIdMap.size());

            // OTIMIZAÃ‡ÃƒO 3: Buscar apenas payslips que nÃ£o estÃ£o no mapa mas podem corresponder aos unified documents
            // OTIMIZAÃ‡ÃƒO: Agrupar por mÃªs/ano para evitar queries repetidas e limitar processamento
            List<Payslip> additionalPayslips = new ArrayList<>();
            Set<String> processedPeriods = new HashSet<>();
            int maxPeriodsToProcess = 30; // Limitar a 30 perÃ­odos diferentes para evitar travamento e respostas grandes
            int periodsProcessed = 0;
            
            for (UnifiedDocument ud : unifiedDocumentsFromDb) {
                // Verificar timeout
                if (System.currentTimeMillis() - startTime > maxExecutionTime) {
                    log.warn("â±ï¸ Timeout durante busca de payslips adicionais. Processando dados jÃ¡ carregados...");
                    break;
                }
                
                if (ud.getPayslip() == null && ud.getEmployeeName() != null && ud.getMonth() != null && ud.getYear() != null) {
                    String periodKey = String.format("%d|%d", ud.getMonth(), ud.getYear());
                    
                    // Evitar buscar o mesmo perÃ­odo mÃºltiplas vezes e limitar quantidade
                    if (!processedPeriods.contains(periodKey) && periodsProcessed < maxPeriodsToProcess) {
                        processedPeriods.add(periodKey);
                        periodsProcessed++;
                        try {
                            List<Payslip> matchingPayslips = payslipRepository.findByMonthAndYear(ud.getMonth(), ud.getYear());
                            
                            // Limitar quantidade de payslips processados por perÃ­odo
                            if (matchingPayslips.size() > 500) {
                                log.warn("âš ï¸ Muitos payslips ({}) para perÃ­odo {}/{}. Limitando processamento a 500 para evitar travamento.", 
                                    matchingPayslips.size(), ud.getMonth(), ud.getYear());
                                matchingPayslips = matchingPayslips.subList(0, 500);
                            }
                            
                            // Processar unified documents deste perÃ­odo
                            for (UnifiedDocument ud2 : unifiedDocumentsFromDb) {
                                if (ud2.getPayslip() == null && 
                                    ud2.getMonth() != null && ud2.getMonth().equals(ud.getMonth()) &&
                                    ud2.getYear() != null && ud2.getYear().equals(ud.getYear()) &&
                                    ud2.getEmployeeName() != null) {
                                    
                                    for (Payslip p : matchingPayslips) {
                                        if (verifyEmployeeNames(ud2.getEmployeeName(), p.getEmployeeName())) {
                                            String key = String.format("%s|%d|%d", 
                                                normalizeName(p.getEmployeeName()), 
                                                p.getMonth(), 
                                                p.getYear());
                                            if (!payslipKeys.contains(key)) {
                                                payslipByIdMap.put(p.getId(), p);
                                                payslipKeys.add(key);
                                                additionalPayslips.add(p);
                                            }
                                        }
                                    }
                                }
                            }
                        } catch (Exception e) {
                            log.warn("âš ï¸ Erro ao buscar payslip adicional para perÃ­odo {}/{}: {}", 
                                ud.getMonth(), ud.getYear(), e.getMessage());
                        }
                    }
                }
            }
            
            log.info("ðŸ“Š [OTIMIZADO] Adicionados {} payslips adicionais encontrados", additionalPayslips.size());
            
            // OTIMIZAÃ‡ÃƒO 4: Converter unified documents diretamente em payslips usando os dados jÃ¡ carregados
            List<Payslip> payslipsForOrganization = new ArrayList<>();
            int processedCount = 0;
            int skippedCount = 0;
            int foundPayslipCount = 0;
            int tempPayslipCount = 0;
            
            for (UnifiedDocument ud : unifiedDocumentsFromDb) {
                if (ud.getEmployeeName() == null || ud.getMonth() == null || ud.getYear() == null) {
                    skippedCount++;
                    continue;
                }
                
                processedCount++;
                Payslip payslip = null;
                
                // EstratÃ©gia 1: Usar payslip jÃ¡ carregado via JOIN FETCH
                try {
                    payslip = ud.getPayslip();
                    if (payslip != null) {
                        // Verificar se o payslip realmente existe e FORÃ‡AR carregamento de todos os campos necessÃ¡rios
                        try {
                            // ForÃ§ar carregamento de todos os campos dentro da transaÃ§Ã£o
                            payslip.getCompanyName();
                            payslip.getFileName(); // Carregar fileName dentro da transaÃ§Ã£o
                            payslip.getCpf();
                            payslip.getEmployeeName();
                            payslip.getMonth();
                            payslip.getYear();
                            payslip.getCompanyCnpj();
                            payslip.getCompanySigla();
                            payslip.getWorkPostName();
                            foundPayslipCount++;
                        } catch (jakarta.persistence.EntityNotFoundException e) {
                            log.debug("âš ï¸ Payslip referenciado nÃ£o existe mais: {}", e.getMessage());
                            payslip = null;
                        } catch (org.hibernate.LazyInitializationException e) {
                            log.debug("âš ï¸ Erro de lazy initialization ao acessar payslip: {}", e.getMessage());
                            payslip = null;
                        }
                    }
                } catch (org.hibernate.LazyInitializationException e) {
                    log.debug("âš ï¸ Erro de lazy initialization ao acessar payslip: {}", e.getMessage());
                    payslip = null;
                } catch (Exception e) {
                    log.debug("âš ï¸ Erro ao acessar payslip: {}", e.getMessage());
                }
                
                // EstratÃ©gia 2: Se nÃ£o encontrou, buscar no mapa de payslips adicionais
                if (payslip == null) {
                    String key = String.format("%s|%d|%d", 
                        normalizeName(ud.getEmployeeName()), 
                        ud.getMonth(), 
                        ud.getYear());
                    
                    // Buscar nos payslips adicionais encontrados
                    for (Payslip p : additionalPayslips) {
                        if (p.getMonth() != null && p.getMonth().equals(ud.getMonth()) &&
                            p.getYear() != null && p.getYear().equals(ud.getYear()) &&
                            verifyEmployeeNames(ud.getEmployeeName(), p.getEmployeeName())) {
                            // Garantir que todos os campos foram carregados
                            try {
                                p.getFileName();
                                p.getCompanyName();
                            } catch (org.hibernate.LazyInitializationException e) {
                                log.debug("âš ï¸ Erro de lazy initialization em payslip adicional: {}", e.getMessage());
                                continue;
                            }
                            payslip = p;
                            foundPayslipCount++;
                            break;
                        }
                    }
                }
                
                // EstratÃ©gia 3: Se ainda nÃ£o encontrou, criar payslip temporÃ¡rio com dados do unified document
                if (payslip == null) {
                    tempPayslipCount++;
                    // Tentar obter dados do payslip relacionado se existir (mesmo que nÃ£o carregado)
                    String cpf = "";
                    String companyName = "";
                    String companyCnpj = "";
                    String companySigla = "";
                    String workPostName = "";
                    
                    try {
                        Payslip relatedPayslip = ud.getPayslip();
                        if (relatedPayslip != null) {
                            try {
                                // Tentar carregar todos os campos dentro da transaÃ§Ã£o
                                cpf = relatedPayslip.getCpf() != null ? relatedPayslip.getCpf() : "";
                                companyName = relatedPayslip.getCompanyName() != null ? relatedPayslip.getCompanyName() : "";
                                companyCnpj = relatedPayslip.getCompanyCnpj() != null ? relatedPayslip.getCompanyCnpj() : "";
                                companySigla = relatedPayslip.getCompanySigla() != null ? relatedPayslip.getCompanySigla() : "";
                                workPostName = relatedPayslip.getWorkPostName() != null ? relatedPayslip.getWorkPostName() : "";
                            } catch (org.hibernate.LazyInitializationException e) {
                                log.debug("âš ï¸ Erro de lazy initialization ao acessar dados do payslip relacionado: {}", e.getMessage());
                            } catch (Exception e) {
                                log.debug("âš ï¸ Erro ao acessar dados do payslip relacionado: {}", e.getMessage());
                            }
                        }
                    } catch (org.hibernate.LazyInitializationException e) {
                        log.debug("âš ï¸ Erro de lazy initialization ao acessar payslip relacionado: {}", e.getMessage());
                    } catch (Exception e) {
                        log.debug("âš ï¸ Erro ao acessar payslip relacionado: {}", e.getMessage());
                    }
                    
                    payslip = Payslip.builder()
                        .employeeName(ud.getEmployeeName())
                        .cpf(cpf)
                        .month(ud.getMonth())
                        .year(ud.getYear())
                        .fileName(ud.getFileName() != null ? ud.getFileName() : "")
                        .companyName(companyName)
                        .companyCnpj(companyCnpj)
                        .companySigla(companySigla)
                        .workPostName(workPostName)
                        .build();
                } else {
                    // Garantir que o nome do arquivo estÃ¡ definido (jÃ¡ foi carregado acima)
                    try {
                        if (payslip.getFileName() == null || payslip.getFileName().isEmpty()) {
                            payslip.setFileName(ud.getFileName() != null ? ud.getFileName() : "");
                        }
                    } catch (org.hibernate.LazyInitializationException e) {
                        log.debug("âš ï¸ Erro de lazy initialization ao acessar fileName: {}", e.getMessage());
                        // Usar fileName do unified document como fallback
                        if (ud.getFileName() != null) {
                            try {
                                payslip.setFileName(ud.getFileName());
                            } catch (Exception ex) {
                                log.debug("âš ï¸ NÃ£o foi possÃ­vel definir fileName: {}", ex.getMessage());
                            }
                        }
                    }
                }
                
                payslipsForOrganization.add(payslip);
            }
            
            log.info("ðŸ“Š [OTIMIZADO] EstatÃ­sticas: {} processados, {} ignorados, {} com payslip encontrado, {} temporÃ¡rios", 
                processedCount, skippedCount, foundPayslipCount, tempPayslipCount);
            
            log.info("ðŸ“Š EstatÃ­sticas de processamento: {} processados, {} ignorados, {} com payslip encontrado, {} com payslip temporÃ¡rio", 
                processedCount, skippedCount, foundPayslipCount, tempPayslipCount);

            log.info("ðŸ“Š [OTIMIZADO] Total de payslips preparados para organizaÃ§Ã£o: {}", payslipsForOrganization.size());
            
            // Verificar timeout antes de organizar
            long timeBeforeOrg = System.currentTimeMillis() - startTime;
            if (timeBeforeOrg > maxExecutionTime) {
                log.warn("â±ï¸ Timeout antes de organizar ({}ms). Retornando resposta parcial...", timeBeforeOrg);
                response.setTotalPayslips(payslipsForOrganization.size());
                response.setCompanies(Collections.emptyList());
                response.setTotalCompanies(0);
                response.setTotalSectors(0);
                return response;
            }
            
            // Usar o mÃ©todo de organizaÃ§Ã£o de payslips
            PayslipOrganizationResponse organizedResponse = payslipService.organizePayslipsByCompany(payslipsForOrganization);
            
            long elapsedTime = System.currentTimeMillis() - startTime;
            log.info("âœ… [OTIMIZADO] OrganizaÃ§Ã£o concluÃ­da em {}ms: {} empresas, {} setores, {} documentos", 
                elapsedTime,
                organizedResponse.getTotalCompanies(), 
                organizedResponse.getTotalSectors(),
                organizedResponse.getTotalPayslips());
            
            // Verificar se demorou muito
            if (elapsedTime > 20000) {
                log.warn("âš ï¸ OrganizaÃ§Ã£o demorou {}ms (mais de 20 segundos). Considere otimizar mais.", elapsedTime);
            }
            
            return organizedResponse;
            
        } catch (Exception e) {
            log.error("âŒ Erro ao organizar documentos unificados: {}", e.getMessage(), e);
            log.error("âŒ Stack trace:", e);
            response.setTotalPayslips(0);
            response.setCompanies(Collections.emptyList());
            response.setTotalCompanies(0);
            response.setTotalSectors(0);
            return response;
        }
    }
    
    /**
     * Extrai informaÃ§Ãµes de empresa e setor do PDF do documento unificado
     */
    private Payslip extractPayslipInfoFromUnifiedDocument(String filePath, String employeeName, Integer month, Integer year, String cpf) {
        log.info("ðŸ“„ Extraindo informaÃ§Ãµes do PDF unificado: {}", filePath);
        
        try {
            File pdfFile = new File(filePath);
            if (!pdfFile.exists()) {
                log.warn("âš ï¸ Arquivo nÃ£o encontrado: {}", filePath);
                return null;
            }
            
            try (PDDocument document = PDDocument.load(pdfFile)) {
                // Extrair texto da primeira pÃ¡gina (onde geralmente estÃ¡ o holerite)
                PDFTextStripper stripper = new PDFTextStripper();
                stripper.setStartPage(1);
                stripper.setEndPage(1);
                String pageText = stripper.getText(document);
                
                if (pageText == null || pageText.trim().isEmpty()) {
                    log.warn("âš ï¸ NÃ£o foi possÃ­vel extrair texto da primeira pÃ¡gina do PDF unificado");
                    return null;
                }
                
                String[] linhas = pageText.split("\r?\n");
                String empresaNome = null;
                String empresaCnpj = null;
                String workPostName = null;
                
                // ============================================
                // EXTRAÃ‡ÃƒO DE EMPRESA: CÃ³digo + Nome + CNPJ na mesma linha
                // Exemplo: "0055 PROMOVER VIGILANCIA PATRIMONIAL LTDA  43576260000112"
                // ============================================
                Pattern empresaPattern = Pattern.compile("^(\\d{4})\\s+(.+?)\\s+(\\d{14})$");
                for (String linha : linhas) {
                    linha = linha.trim();
                    Matcher empresaMatcher = empresaPattern.matcher(linha);
                    if (empresaMatcher.find()) {
                        String codigo = empresaMatcher.group(1);
                        empresaNome = empresaMatcher.group(2).trim();
                        empresaCnpj = empresaMatcher.group(3);
                        
                        log.info("âœ… Empresa encontrada (cÃ³digo + nome + CNPJ na mesma linha):");
                        log.info("   CÃ³digo: {}, Nome: {}, CNPJ: {}", codigo, empresaNome, empresaCnpj);
                        break;
                    }
                }
                
                // Fallback: buscar padrÃ£o mais flexÃ­vel (cÃ³digo + nome + CNPJ, mas com espaÃ§os variÃ¡veis)
                if (empresaNome == null || empresaCnpj == null) {
                    Pattern empresaPatternFlex = Pattern.compile("^(\\d{3,5})\\s+(.+?)\\s+(\\d{14})$");
                    for (String linha : linhas) {
                        linha = linha.trim();
                        Matcher empresaMatcher = empresaPatternFlex.matcher(linha);
                        if (empresaMatcher.find()) {
                            String codigo = empresaMatcher.group(1);
                            String nome = empresaMatcher.group(2).trim();
                            String cnpj = empresaMatcher.group(3);
                            
                            // Validar que o nome parece ser um nome de empresa (contÃ©m palavras comuns)
                            if (nome.length() > 10 && (nome.toUpperCase().contains("LTDA") || 
                                nome.toUpperCase().contains("S.A") || nome.toUpperCase().contains("ME") ||
                                nome.toUpperCase().contains("EIRELI") || nome.length() > 20)) {
                                empresaNome = nome;
                                empresaCnpj = cnpj;
                                log.info("âœ… Empresa encontrada (padrÃ£o flexÃ­vel):");
                                log.info("   CÃ³digo: {}, Nome: {}, CNPJ: {}", codigo, empresaNome, empresaCnpj);
                                break;
                            }
                        }
                    }
                }
                
                // ============================================
                // EXTRAÃ‡ÃƒO DE SETOR: PerÃ­odo + Nome do Setor na mesma linha
                // Exemplo: "01/10/2025 a 31/10/2025 TRUCK PARK BR"
                // ============================================
                Pattern periodoSetorPattern = Pattern.compile("(\\d{2})/(\\d{2})/(\\d{4})\\s+(?:a|Ã )\\s+(\\d{2})/(\\d{2})/(\\d{4})\\s+(.+)$");
                for (String linha : linhas) {
                    linha = linha.trim();
                    Matcher periodoSetorMatcher = periodoSetorPattern.matcher(linha);
                    if (periodoSetorMatcher.find()) {
                        String setor = periodoSetorMatcher.group(6).trim();
                        // Limpar o setor removendo caracteres especiais e espaÃ§os extras
                        setor = setor.replaceAll("[^a-zA-ZÃ€-Ã¿0-9\\s]", " ").replaceAll("\\s+", " ").trim();
                        if (setor.length() > 2) {
                            workPostName = setor;
                            log.info("âœ… Setor encontrado (perÃ­odo + setor na mesma linha):");
                            log.info("   PerÃ­odo: {}/{}/{} a {}/{}/{}", 
                                periodoSetorMatcher.group(1), periodoSetorMatcher.group(2), periodoSetorMatcher.group(3),
                                periodoSetorMatcher.group(4), periodoSetorMatcher.group(5), periodoSetorMatcher.group(3));
                            log.info("   Setor: {}", workPostName);
                            break;
                        }
                    }
                }
                
                // Fallback: buscar perÃ­odo e setor em linhas prÃ³ximas
                if (workPostName == null) {
                    Pattern periodoPattern = Pattern.compile("(\\d{2})/(\\d{2})/(\\d{4})\\s+(?:a|Ã )\\s+(\\d{2})/(\\d{2})/(\\d{4})");
                    for (int idx = 0; idx < linhas.length; idx++) {
                        String linha = linhas[idx].trim();
                        Matcher periodoMatcher = periodoPattern.matcher(linha);
                        if (periodoMatcher.find()) {
                            // Verificar se hÃ¡ texto apÃ³s o perÃ­odo na mesma linha
                            String trailingText = linha.substring(periodoMatcher.end()).trim();
                            if (trailingText.length() > 3) {
                                trailingText = trailingText.replaceAll("[^a-zA-ZÃ€-Ã¿0-9\\s]", " ").replaceAll("\\s+", " ").trim();
                                if (trailingText.length() > 2) {
                                    workPostName = trailingText;
                                    log.info("âœ… Setor encontrado (texto apÃ³s perÃ­odo na mesma linha): {}", workPostName);
                                    break;
                                }
                            }
                            
                            // Verificar linha seguinte
                            if (idx + 1 < linhas.length) {
                                String nextLine = linhas[idx + 1].trim();
                                nextLine = nextLine.replaceAll("[^a-zA-ZÃ€-Ã¿0-9\\s]", " ").replaceAll("\\s+", " ").trim();
                                if (nextLine.length() > 2 && nextLine.length() < 100) {
                                    workPostName = nextLine;
                                    log.info("âœ… Setor encontrado (linha apÃ³s perÃ­odo): {}", workPostName);
                                    break;
                                }
                            }
                        }
                    }
                }
                
                // Criar Payslip com informaÃ§Ãµes extraÃ­das
                return Payslip.builder()
                    .employeeName(employeeName != null ? employeeName : "Desconhecido")
                    .cpf(cpf != null && !cpf.isEmpty() ? cpf : "")
                    .companyName(empresaNome)
                    .companyCnpj(empresaCnpj)
                    .workPostName(workPostName)
                    .month(month)
                    .year(year)
                    .fileName(new File(filePath).getName())
                    .build();
            }
        } catch (Exception e) {
            log.error("âŒ Erro ao extrair informaÃ§Ãµes do PDF unificado {}: {}", filePath, e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * Extrai o nome do funcionÃ¡rio do PDF do holerite
     * Busca por linha que contenha cÃ³digo (6 dÃ­gitos), nome e CPF
     */
    private String extractEmployeeNameFromPayslipPDF(String payslipPath) {
        try {
            File payslipFile = new File(payslipPath);
            if (!payslipFile.exists()) {
                log.warn("âš ï¸ Arquivo do holerite nÃ£o existe: {}", payslipPath);
                return null;
            }
            
            try (PDDocument document = PDDocument.load(payslipFile)) {
                PDFTextStripper stripper = new PDFTextStripper();
                String payslipText = stripper.getText(document);
                
                if (payslipText == null || payslipText.trim().isEmpty()) {
                    return null;
                }
                
                String[] lines = payslipText.split("\r?\n");
                Pattern codePattern = Pattern.compile("\\b\\d{6}\\b");
                Pattern cpfPattern = Pattern.compile("(?:CPF|cpf)[:\\s]*([0-9]{11}|[0-9]{3}\\.[0-9]{3}\\.[0-9]{3}-[0-9]{2})", Pattern.CASE_INSENSITIVE);
                
                for (String line : lines) {
                    if (line == null || line.trim().isEmpty()) {
                        continue;
                    }
                    
                    Matcher codeMatcher = codePattern.matcher(line);
                    Matcher cpfMatcher = cpfPattern.matcher(line);
                    
                    if (codeMatcher.find() && cpfMatcher.find()) {
                        String code = codeMatcher.group();
                        String cpf = cpfMatcher.group(1).replaceAll("[^0-9]", "");
                        
                        int codeStart = codeMatcher.start();
                        int cpfStart = cpfMatcher.start();
                        String nameSection = line.substring(codeStart + code.length(), cpfStart).trim();
                        
                        String extractedName = nameSection
                            .replaceAll("[^a-zA-ZÃ€-Ã¿\\s]", " ")
                            .replaceAll("\\s+", " ")
                            .replaceAll("(?i)\\b(codigo|cÃ³digo|funcionario|funcionÃ¡rio|empregado|colaborador)\\b", "")
                            .replaceAll("\\s+", " ")
                            .trim();
                        
                        if (extractedName != null && extractedName.length() >= 3) {
                            log.info("âœ… Nome extraÃ­do do holerite: '{}' (cÃ³digo: {}, CPF: {})", extractedName, code, cpf);
                            return extractedName;
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("âš ï¸ Erro ao extrair nome do PDF do holerite {}: {}", payslipPath, e.getMessage());
        }
        return null;
    }
    
    /**
     * Extrai o nome do funcionÃ¡rio do PDF do comprovante
     * Busca pelo nome da conta creditada
     */
    private String extractEmployeeNameFromReceiptPDF(String receiptPath) {
        try {
            File receiptFile = new File(receiptPath);
            if (!receiptFile.exists()) {
                log.warn("âš ï¸ Arquivo do comprovante nÃ£o existe: {}", receiptPath);
                return null;
            }
            
            try (PDDocument document = PDDocument.load(receiptFile)) {
                PDFTextStripper stripper = new PDFTextStripper();
                String receiptText = stripper.getText(document);
                
                if (receiptText == null || receiptText.trim().isEmpty()) {
                    return null;
                }
                
                // Buscar por padrÃµes de conta creditada
                Pattern creditedPattern = Pattern.compile("(?i)(?:conta\\s+creditada|favorecido|beneficiÃ¡rio|nome)[:\\s]+([A-ZÃ€-Ã¿][A-ZÃ€-Ã¿\\s\\.]+)", Pattern.MULTILINE);
                Matcher creditedMatcher = creditedPattern.matcher(receiptText);
                
                if (creditedMatcher.find()) {
                    String extractedName = creditedMatcher.group(1).trim();
                    log.info("âœ… Nome extraÃ­do do comprovante: '{}'", extractedName);
                    return extractedName;
                }
            }
        } catch (Exception e) {
            log.warn("âš ï¸ Erro ao extrair nome do PDF do comprovante {}: {}", receiptPath, e.getMessage());
        }
        return null;
    }
    
    /**
     * Busca o holerite correspondente ao comprovante verificando no PDF do holerite
     * se o nome da conta creditada (que pode estar abreviado) aparece na mesma linha
     * do cÃ³digo e do CPF.
     * 
     * @param receiptCreditedName Nome da conta creditada do comprovante (pode estar abreviado, ex: "Jose M. Ramos")
     * @param payslips Lista de holerites candidatos para verificar
     * @return O holerite correspondente ou null se nÃ£o encontrado
     */
    private Payslip findPayslipByReceiptNameInPDF(String receiptCreditedName, List<Payslip> payslips) {
        if (receiptCreditedName == null || receiptCreditedName.trim().isEmpty() || payslips == null || payslips.isEmpty()) {
            return null;
        }
        
        log.info("ðŸ” Buscando holerite para comprovante com nome: '{}' (verificando no PDF)", receiptCreditedName);
        
        // Normalizar nome do comprovante para comparaÃ§Ã£o
        String normalizedReceiptName = normalizeNameForSearch(receiptCreditedName.trim());
        log.info("ðŸ“ Nome normalizado do comprovante: '{}'", normalizedReceiptName);
        
        for (Payslip payslip : payslips) {
            if (payslip.getArquivoCaminho() == null || payslip.getArquivoCaminho().trim().isEmpty()) {
                log.debug("âš ï¸ Holerite sem arquivoCaminho, pulando: {}", payslip.getEmployeeName());
                continue;
            }
            
            try {
                File payslipFile = new File(payslip.getArquivoCaminho());
                if (!payslipFile.exists()) {
                    log.debug("âš ï¸ Arquivo do holerite nÃ£o existe: {}", payslip.getArquivoCaminho());
                    continue;
                }
                
                log.info("ðŸ“„ Verificando holerite: {} - {}/{} (arquivo: {})", 
                    payslip.getEmployeeName(), payslip.getMonth(), payslip.getYear(), payslipFile.getName());
                
                // Extrair texto do PDF do holerite
                try (PDDocument document = PDDocument.load(payslipFile)) {
                    PDFTextStripper stripper = new PDFTextStripper();
                    String payslipText = stripper.getText(document);
                    
                    if (payslipText == null || payslipText.trim().isEmpty()) {
                        log.debug("âš ï¸ NÃ£o foi possÃ­vel extrair texto do PDF do holerite: {}", payslipFile.getName());
                        continue;
                    }
                    
                    // Dividir em linhas
                    String[] lines = payslipText.split("\r?\n");
                    
                    // Procurar por linhas que contenham cÃ³digo (6 dÃ­gitos), nome e CPF na mesma linha
                    // PadrÃ£o: cÃ³digo (ex: 000026), nome (ex: SERGIO PEREIRA LEMOS), CPF (ex: CPF: 28469549847)
                    Pattern codePattern = Pattern.compile("\\b\\d{6}\\b"); // CÃ³digo de 6 dÃ­gitos
                    Pattern cpfPattern = Pattern.compile("(?:CPF|cpf)[:\\s]*([0-9]{11}|[0-9]{3}\\.[0-9]{3}\\.[0-9]{3}-[0-9]{2})", Pattern.CASE_INSENSITIVE);
                    
                    for (String line : lines) {
                        if (line == null || line.trim().isEmpty()) {
                            continue;
                        }
                        
                        // Verificar se a linha contÃ©m cÃ³digo e CPF
                        Matcher codeMatcher = codePattern.matcher(line);
                        Matcher cpfMatcher = cpfPattern.matcher(line);
                        
                        if (codeMatcher.find() && cpfMatcher.find()) {
                            // Linha contÃ©m cÃ³digo e CPF - extrair o nome dessa linha
                            String code = codeMatcher.group();
                            String cpf = cpfMatcher.group(1).replaceAll("[^0-9]", "");
                            
                            // Encontrar posiÃ§Ãµes do cÃ³digo e CPF na linha
                            int codeStart = codeMatcher.start();
                            int cpfStart = cpfMatcher.start();
                            
                            // Extrair nome da linha (entre o cÃ³digo e o CPF)
                            // O nome geralmente estÃ¡ entre o cÃ³digo e o CPF
                            String nameSection = line.substring(codeStart + code.length(), cpfStart).trim();
                            
                            // Limpar o nome: remover caracteres especiais, nÃºmeros isolados, etc.
                            // Manter apenas letras, espaÃ§os e acentos
                            String extractedName = nameSection
                                .replaceAll("[^a-zA-ZÃ€-Ã¿\\s]", " ") // Substituir caracteres especiais por espaÃ§o
                                .replaceAll("\\s+", " ") // MÃºltiplos espaÃ§os para um sÃ³
                                .trim();
                            
                            // Remover palavras comuns que podem estar na linha
                            extractedName = extractedName
                                .replaceAll("(?i)\\b(codigo|cÃ³digo|funcionario|funcionÃ¡rio|empregado|colaborador)\\b", "")
                                .replaceAll("\\s+", " ")
                                .trim();
                            
                            if (extractedName == null || extractedName.trim().isEmpty() || extractedName.length() < 3) {
                                log.debug("âš ï¸ Nome extraÃ­do muito curto ou vazio: '{}'", extractedName);
                                continue;
                            }
                            
                            log.info("ðŸ” Linha encontrada com cÃ³digo e CPF: '{}'", line.trim());
                            log.info("   CÃ³digo: {}, Nome extraÃ­do do holerite: '{}', CPF: {}", code, extractedName, cpf);
                            log.info("   Nome do comprovante (conta creditada): '{}'", receiptCreditedName);
                            
                            // Verificar se o nome do comprovante (que pode estar abreviado) corresponde ao nome extraÃ­do da linha (completo)
                            // Exemplo: "Jose M. Ramos" (comprovante) vs "JOSE MARIO RAMOS" (holerite)
                            // O mÃ©todo verifyEmployeeNames jÃ¡ suporta abreviaÃ§Ãµes atravÃ©s de checkNamesWithAbbreviations
                            log.info("ðŸ” Verificando se o nome do comprovante (pode estar abreviado) corresponde ao nome do holerite (completo)...");
                            boolean nameMatches = verifyEmployeeNames(extractedName, receiptCreditedName) ||
                                                verifyEmployeeNames(receiptCreditedName, extractedName);
                            
                            if (nameMatches) {
                                log.info("âœ… Holerite encontrado! Nome do comprovante corresponde ao nome no holerite");
                                log.info("   Linha completa: '{}'", line.trim());
                                log.info("   CÃ³digo: {}, Nome no holerite: '{}', CPF: {}", code, extractedName, cpf);
                                log.info("   Nome no comprovante: '{}'", receiptCreditedName);
                                
                                return payslip;
                            } else {
                                log.debug("   âŒ Nome do comprovante '{}' NÃƒO corresponde ao nome extraÃ­do '{}'", receiptCreditedName, extractedName);
                            }
                        }
                    }
                    
                    log.debug("âš ï¸ Nome '{}' nÃ£o encontrado no PDF do holerite {}", receiptCreditedName, payslipFile.getName());
                    
                } catch (Exception e) {
                    log.warn("âš ï¸ Erro ao processar PDF do holerite {}: {}", payslip.getArquivoCaminho(), e.getMessage());
                }
                
            } catch (Exception e) {
                log.warn("âš ï¸ Erro ao abrir arquivo do holerite {}: {}", payslip.getArquivoCaminho(), e.getMessage());
            }
        }
        
        log.warn("âŒ Nenhum holerite encontrado para o comprovante com nome: '{}'", receiptCreditedName);
        return null;
    }
    
    /**
     * Sanitiza candidato a setor (mesma lÃ³gica do PayslipService)
     */
    private String sanitizeWorkPostCandidate(String candidate) {
        if (candidate == null) {
            return null;
        }
        String cleaned = candidate.replaceAll("[\\p{Cntrl}]", " ").trim();
        if (cleaned.isEmpty()) {
            return null;
        }

        // Se houver rÃ³tulo "SETOR: ..." manter apenas o que vem depois dos dois pontos
        int colonIndex = cleaned.indexOf(':');
        if (colonIndex >= 0 && colonIndex < cleaned.length() - 1) {
            cleaned = cleaned.substring(colonIndex + 1).trim();
        }

        cleaned = cleaned.replaceAll("[â€¢Â·]+", " ");
        cleaned = cleaned.replaceAll("[\\s]+", " ").trim();
        cleaned = cleaned.replaceAll("[.,;]+$", "").trim();
        
        // Validar se parece um setor vÃ¡lido (mais de 2 caracteres, nÃ£o Ã© apenas nÃºmeros)
        if (cleaned.length() < 3) {
            return null;
        }
        if (cleaned.matches("^\\d+$")) {
            return null;
        }
        
        // Remover palavras comuns que nÃ£o sÃ£o setor
        String upper = cleaned.toUpperCase();
        if (upper.contains("PERÃODO") || upper.contains("REFERÃŠNCIA") || 
            upper.contains("COMPETÃŠNCIA") || upper.contains("FUNCIONÃRIO") ||
            upper.contains("CPF") || upper.contains("CNPJ") ||
            upper.contains("EMPRESA") || upper.contains("NOME")) {
            return null;
        }
        
        return cleaned;
    }

    // ===== PROCESSAMENTO ASSÃNCRONO =====

    /**
     * Cria um job de unificaÃ§Ã£o em lote e retorna imediatamente
     */
    @Transactional
    public com.z7design.fleet_manager.model.UnificationJob createUnificationJob(
            Integer month, Integer year, Boolean forceUnification, UUID createdBy) {
        
        log.info("ðŸ“‹ Criando job de unificaÃ§Ã£o em lote: MÃªs={}, Ano={}, Force={}", month, year, forceUnification);
        
        try {
            // Verificar se a tabela existe tentando fazer uma query simples
            try {
                log.debug("ðŸ” Verificando se a tabela unification_jobs existe...");
                long count = unificationJobRepository.count();
                log.debug("âœ… Tabela unification_jobs existe. Total de jobs: {}", count);
            } catch (Exception e) {
                String errorMsg = e.getMessage() != null ? e.getMessage() : "";
                String causeMsg = e.getCause() != null && e.getCause().getMessage() != null ? 
                    e.getCause().getMessage() : "";
                
                log.error("âŒ Erro ao verificar tabela unification_jobs: {}", errorMsg);
                log.error("âŒ Causa: {}", causeMsg);
                log.error("âŒ Tipo de exceÃ§Ã£o: {}", e.getClass().getName());
                
                if (errorMsg.contains("nÃ£o existe") || 
                    errorMsg.contains("does not exist") ||
                    errorMsg.contains("unification_jobs") ||
                    causeMsg.contains("nÃ£o existe") ||
                    causeMsg.contains("does not exist") ||
                    causeMsg.contains("unification_jobs") ||
                    e.getClass().getName().contains("SQLGrammarException") ||
                    e.getClass().getName().contains("PSQLException")) {
                    log.error("âŒ ERRO CRÃTICO: A tabela 'unification_jobs' nÃ£o existe no banco de dados!");
                    log.error("âŒ Por favor, execute a migration V338__create_unification_jobs_table.sql");
                    throw new RuntimeException("A tabela 'unification_jobs' nÃ£o existe no banco de dados. " +
                        "Por favor, execute a migration V338__create_unification_jobs_table.sql para criar a tabela. " +
                        "Erro: " + errorMsg, e);
                }
                // Se nÃ£o for erro de tabela nÃ£o existente, relanÃ§ar
                log.error("âŒ Erro inesperado ao verificar tabela: {}", e.getClass().getName());
                throw e;
            }
            
            // Contar quantos documentos serÃ£o processados
            log.debug("ðŸ“Š Buscando holerites para processamento...");
            List<Payslip> allPayslips = payslipService.getAllPayslips();
            log.debug("ðŸ“Š Total de holerites encontrados: {}", allPayslips.size());
            
            List<Payslip> filteredPayslips = allPayslips.stream()
                .filter(p -> month == null || p.getMonth().equals(month))
                .filter(p -> year == null || p.getYear().equals(year))
                .filter(p -> p.getEmployeeName() != null && p.getMonth() != null && p.getYear() != null)
                .toList();
            
            log.debug("ðŸ“Š Holerites apÃ³s filtro: {}", filteredPayslips.size());
            
            Map<String, Payslip> uniquePayslips = filteredPayslips.stream()
                .filter(p -> p.getEmployeeName() != null && !p.getEmployeeName().trim().isEmpty())
                .collect(Collectors.toMap(
                    p -> p.getEmployeeName().trim().toUpperCase() + "_" + p.getMonth() + "_" + p.getYear(),
                    p -> p,
                    (existing, replacement) -> existing
                ));
            
            int totalDocuments = uniquePayslips.size();
            log.debug("ðŸ“Š Documentos Ãºnicos para processar: {}", totalDocuments);
            
            // Criar job
            log.debug("ðŸ“ Criando objeto UnificationJob...");
            com.z7design.fleet_manager.model.UnificationJob job = com.z7design.fleet_manager.model.UnificationJob.builder()
                .status(com.z7design.fleet_manager.model.UnificationJob.JobStatus.PENDING)
                .month(month)
                .year(year)
                .forceUnification(forceUnification != null ? forceUnification : false)
                .totalDocuments(totalDocuments)
                .processedDocuments(0)
                .successCount(0)
                .failureCount(0)
                .createdBy(createdBy)
                .build();
            
            log.debug("ðŸ’¾ Salvando job no banco de dados...");
            try {
                job = unificationJobRepository.save(job);
                log.info("âœ… Job criado com sucesso: ID={}, Total de documentos: {}", job.getId(), totalDocuments);
            } catch (Exception saveError) {
                log.error("âŒ Erro ao salvar job no banco de dados: {}", saveError.getMessage(), saveError);
                log.error("âŒ Tipo de exceÃ§Ã£o: {}", saveError.getClass().getName());
                if (saveError.getCause() != null) {
                    log.error("âŒ Causa: {}", saveError.getCause().getMessage());
                }
                throw saveError;
            }
            
            // Retornar o job (a transaÃ§Ã£o serÃ¡ commitada antes do processamento assÃ­ncrono)
            // O mÃ©todo assÃ­ncrono serÃ¡ executado em thread separada e transaÃ§Ã£o separada
            com.z7design.fleet_manager.model.UnificationJob savedJob = job;
            
            // Iniciar processamento assÃ­ncrono (serÃ¡ executado em thread separada apÃ³s o commit)
            // O @Async garante execuÃ§Ã£o em thread separada, e REQUIRES_NEW garante transaÃ§Ã£o separada
            try {
                processUnificationJobAsync(savedJob.getId());
                log.info("âœ… Processamento assÃ­ncrono iniciado para job: {}", savedJob.getId());
            } catch (Exception e) {
                log.error("âš ï¸ Erro ao iniciar processamento assÃ­ncrono (job continuarÃ¡ em PENDING): {}", e.getMessage(), e);
                // NÃ£o propagar o erro - o job foi criado e pode ser processado manualmente depois
            }
            
            return savedJob;
            
        } catch (org.hibernate.exception.SQLGrammarException e) {
            String errorMsg = e.getMessage() != null ? e.getMessage() : "";
            if (errorMsg.contains("nÃ£o existe") || 
                errorMsg.contains("does not exist") ||
                errorMsg.contains("unification_jobs")) {
                log.error("âŒ ERRO CRÃTICO: A tabela 'unification_jobs' nÃ£o existe no banco de dados!");
                log.error("âŒ Erro: {}", errorMsg);
                throw new RuntimeException("A tabela 'unification_jobs' nÃ£o existe no banco de dados. " +
                    "Por favor, execute a migration V338__create_unification_jobs_table.sql para criar a tabela. " +
                    "Erro original: " + errorMsg, e);
            }
            throw e;
        } catch (Exception e) {
            String errorMsg = e.getMessage() != null ? e.getMessage() : "";
            // Verificar se Ã© erro de tabela nÃ£o existente (PostgreSQL)
            if (errorMsg.contains("nÃ£o existe") || 
                errorMsg.contains("does not exist") ||
                errorMsg.contains("unification_jobs") ||
                (e.getCause() != null && e.getCause().getMessage() != null && 
                 (e.getCause().getMessage().contains("nÃ£o existe") || 
                  e.getCause().getMessage().contains("does not exist") ||
                  e.getCause().getMessage().contains("unification_jobs")))) {
                log.error("âŒ ERRO CRÃTICO: A tabela 'unification_jobs' nÃ£o existe no banco de dados!");
                log.error("âŒ Erro: {}", errorMsg);
                throw new RuntimeException("A tabela 'unification_jobs' nÃ£o existe no banco de dados. " +
                    "Por favor, execute a migration V338__create_unification_jobs_table.sql para criar a tabela. " +
                    "Reinicie a aplicaÃ§Ã£o para que o Flyway execute as migrations pendentes. " +
                    "Erro original: " + errorMsg, e);
            }
            throw e;
        }
    }

    /**
     * Processa um job de unificaÃ§Ã£o em lote de forma assÃ­ncrona
     */
    @Async
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void processUnificationJobAsync(UUID jobId) {
        log.info("ðŸš€ Iniciando processamento assÃ­ncrono do job: {}", jobId);
        
        try {
            com.z7design.fleet_manager.model.UnificationJob job = unificationJobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job nÃ£o encontrado: " + jobId));
            
            processUnificationJobInternal(jobId, job);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro crÃ­tico no processamento assÃ­ncrono do job {}: {}", jobId, e.getMessage(), e);
            // Tentar atualizar o job com status de erro (em nova transaÃ§Ã£o)
            try {
                updateJobStatusInNewTransaction(jobId, com.z7design.fleet_manager.model.UnificationJob.JobStatus.FAILED, 
                    "Erro crÃ­tico: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
            } catch (Exception updateError) {
                log.error("ðŸ’¥ Erro ao atualizar status do job apÃ³s falha: {}", updateError.getMessage(), updateError);
            }
        }
    }
    
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    private void updateJobStatusInNewTransaction(UUID jobId, com.z7design.fleet_manager.model.UnificationJob.JobStatus status, String errorMessage) {
        com.z7design.fleet_manager.model.UnificationJob job = unificationJobRepository.findById(jobId).orElse(null);
        if (job != null) {
            job.setStatus(status);
            if (errorMessage != null) {
                job.setErrorMessage(errorMessage);
            }
            job.setCompletedAt(LocalDateTime.now());
            unificationJobRepository.save(job);
        }
    }
    
    private void processUnificationJobInternal(UUID jobId, com.z7design.fleet_manager.model.UnificationJob job) {
        try {
            // Atualizar status para PROCESSING
            job.setStatus(com.z7design.fleet_manager.model.UnificationJob.JobStatus.PROCESSING);
            job.setStartedAt(LocalDateTime.now());
            unificationJobRepository.save(job);
            
            long startTime = System.currentTimeMillis();
            
            // Criar request
            com.z7design.fleet_manager.dto.BatchUnificationRequest request = 
                com.z7design.fleet_manager.dto.BatchUnificationRequest.builder()
                    .month(job.getMonth())
                    .year(job.getYear())
                    .forceUnification(job.getForceUnification())
                    .build();
            
            // Buscar todos os holerites
            List<Payslip> allPayslips = payslipService.getAllPayslips();
            List<Payslip> filteredPayslips = allPayslips.stream()
                .filter(p -> request.getMonth() == null || p.getMonth().equals(request.getMonth()))
                .filter(p -> request.getYear() == null || p.getYear().equals(request.getYear()))
                .filter(p -> p.getEmployeeName() != null && p.getMonth() != null && p.getYear() != null)
                .toList();
            
            Map<String, Payslip> uniquePayslips = filteredPayslips.stream()
                .filter(p -> p.getEmployeeName() != null && !p.getEmployeeName().trim().isEmpty())
                .collect(Collectors.toMap(
                    p -> p.getEmployeeName().trim().toUpperCase() + "_" + p.getMonth() + "_" + p.getYear(),
                    p -> p,
                    (existing, replacement) -> existing
                ));
            
            int totalDocuments = uniquePayslips.size();
            job.setTotalDocuments(totalDocuments);
            unificationJobRepository.save(job);
            
            log.info("ðŸ“Š Processando {} documentos Ãºnicos", totalDocuments);
            
            // Processar cada documento
            int processed = 0;
            int success = 0;
            int failure = 0;
            
            for (Payslip payslip : uniquePayslips.values()) {
                // Verificar se o job foi cancelado
                job = unificationJobRepository.findById(jobId).orElse(null);
                if (job == null || job.getStatus() == com.z7design.fleet_manager.model.UnificationJob.JobStatus.CANCELLED) {
                    log.warn("âš ï¸ Job {} foi cancelado. Parando processamento.", jobId);
                    break;
                }
                
                String employeeName = payslip.getEmployeeName();
                Integer month = payslip.getMonth();
                Integer year = payslip.getYear();
                
                try {
                    // Usar a mesma lÃ³gica do mÃ©todo sÃ­ncrono, mas atualizando o job
                    boolean successResult = processSingleDocumentForJob(jobId, employeeName, month, year, request.getForceUnification());
                    
                    if (successResult) {
                        success++;
                    } else {
                        failure++;
                    }
                } catch (Exception e) {
                    log.error("ðŸ’¥ Erro ao processar documento {} - {}/{}: {}", employeeName, month, year, e.getMessage());
                    failure++;
                }
                
                processed++;
                
                // Atualizar progresso a cada 10 documentos ou no Ãºltimo
                if (processed % 10 == 0 || processed == totalDocuments) {
                    job = unificationJobRepository.findById(jobId).orElse(null);
                    if (job != null) {
                        job.setProcessedDocuments(processed);
                        job.setSuccessCount(success);
                        job.setFailureCount(failure);
                        unificationJobRepository.save(job);
                        log.info("ðŸ“Š Progresso: {}/{} processados ({} sucesso, {} falhas)", 
                            processed, totalDocuments, success, failure);
                    }
                }
            }
            
            // Finalizar job
            long endTime = System.currentTimeMillis();
            job = unificationJobRepository.findById(jobId).orElse(null);
            if (job != null) {
                // Status serÃ¡ COMPLETED mesmo com falhas (o job foi processado completamente)
                job.setStatus(com.z7design.fleet_manager.model.UnificationJob.JobStatus.COMPLETED);
                job.setProcessedDocuments(processed);
                job.setSuccessCount(success);
                job.setFailureCount(failure);
                job.setProcessingTimeMs(endTime - startTime);
                job.setCompletedAt(LocalDateTime.now());
                if (failure > 0) {
                    job.setErrorMessage(String.format("Processamento concluÃ­do com %d sucesso(s) e %d falha(s)", success, failure));
                }
                unificationJobRepository.save(job);
                
                log.info("âœ… Job {} concluÃ­do: {} processados, {} sucesso, {} falhas, tempo: {} ms", 
                    jobId, processed, success, failure, endTime - startTime);
            }
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro crÃ­tico ao processar job {}: {}", jobId, e.getMessage(), e);
            // Atualizar status do job em nova transaÃ§Ã£o para evitar problemas de rollback
            try {
                updateJobStatusInNewTransaction(jobId, com.z7design.fleet_manager.model.UnificationJob.JobStatus.FAILED, 
                    "Erro crÃ­tico: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
            } catch (Exception updateError) {
                log.error("ðŸ’¥ Erro ao atualizar status do job apÃ³s falha: {}", updateError.getMessage(), updateError);
            }
        }
    }

    /**
     * Processa um Ãºnico documento para um job (extraÃ­do da lÃ³gica do mÃ©todo sÃ­ncrono)
     */
    private boolean processSingleDocumentForJob(UUID jobId, String employeeName, Integer month, Integer year, Boolean forceUnification) {
        try {
            // Buscar holerite
            final String cleanEmployeeName = cleanText(employeeName);
            String normalizedSearchNameHolerite = normalizeNameForSearch(cleanEmployeeName);
            
            List<Payslip> payslipsInDb = payslipService.getAllPayslips().stream()
                .filter(p -> p.getMonth() != null && p.getMonth().equals(month))
                .filter(p -> p.getYear() != null && p.getYear().equals(year))
                .collect(java.util.stream.Collectors.toList());
            
            Payslip matchingPayslip = null;
            for (Payslip p : payslipsInDb) {
                if (p.getEmployeeName() != null) {
                    String normalizedPayslipName = normalizeNameForSearch(p.getEmployeeName());
                    boolean exactMatch = normalizedPayslipName.equals(normalizedSearchNameHolerite);
                    boolean containsMatch = normalizedPayslipName.contains(normalizedSearchNameHolerite) || 
                                           normalizedSearchNameHolerite.contains(normalizedPayslipName);
                    boolean verifyMatch = verifyEmployeeNames(cleanEmployeeName, p.getEmployeeName());
                    
                    if (exactMatch || containsMatch || verifyMatch) {
                        matchingPayslip = p;
                        break;
                    }
                }
            }
            
            String holeritePath = null;
            if (matchingPayslip != null && matchingPayslip.getArquivoCaminho() != null) {
                holeritePath = matchingPayslip.getArquivoCaminho();
                Path absolutePath = Paths.get(holeritePath);
                if (!Files.exists(absolutePath)) {
                    Path relativePath = Paths.get(System.getProperty("user.dir"), holeritePath);
                    if (Files.exists(relativePath)) {
                        holeritePath = relativePath.toAbsolutePath().toString();
                    } else {
                        holeritePath = null;
                    }
                }
            }
            
            if (holeritePath == null || !Files.exists(Paths.get(holeritePath))) {
                holeritePath = findHoleriteOriginalFileByNameAndPeriod(cleanEmployeeName, month, year);
            }
            
            if (holeritePath == null || !Files.exists(Paths.get(holeritePath))) {
                log.warn("âŒ Holerite nÃ£o encontrado para {} - {}/{}", employeeName, month, year);
                return false;
            }
            
            // Buscar comprovantes
            String normalizedName = normalizeNameForSearch(employeeName);
            int receiptMonthNext = month == 12 ? 1 : month + 1;
            int receiptYearNext = month == 12 ? year + 1 : year;
            
            List<PaymentReceipt> receiptsInPeriod = new ArrayList<>();
            List<PaymentReceipt> receiptsNextMonth = receiptRepository.findByYearAndMonth(receiptYearNext, receiptMonthNext);
            receiptsInPeriod.addAll(receiptsNextMonth);
            
            List<PaymentReceipt> receiptsSameMonth = receiptRepository.findByYearAndMonth(year, month);
            for (PaymentReceipt receipt : receiptsSameMonth) {
                if (!receiptsInPeriod.contains(receipt)) {
                    receiptsInPeriod.add(receipt);
                }
            }
            
            List<PaymentReceipt> matchedByName = receiptsInPeriod.stream()
                .filter(receipt -> {
                    if (receipt.getEmployeeName() == null) return false;
                    boolean exactMatch = verifyEmployeeNames(employeeName, receipt.getEmployeeName());
                    boolean flexibleMatch = isFlexibleNameMatch(employeeName, receipt.getEmployeeName());
                    boolean normalizedMatch = normalizeNameForSearch(receipt.getEmployeeName())
                        .contains(normalizedName) || normalizedName.contains(normalizeNameForSearch(receipt.getEmployeeName()));
                    return exactMatch || flexibleMatch || normalizedMatch;
                })
                .collect(Collectors.toList());
            
            if (matchedByName.isEmpty()) {
                List<PaymentReceipt> receiptsByName = receiptRepository
                    .findByEmployeeNameContainingIgnoreCase(employeeName);
                
                String[] nameParts = employeeName.trim().toUpperCase().split("\\s+");
                if (nameParts.length >= 2) {
                    String firstName = nameParts[0];
                    String lastName = nameParts[nameParts.length - 1];
                    List<PaymentReceipt> receiptsByFirst = receiptRepository
                        .findByEmployeeNameContainingIgnoreCase(firstName);
                    for (PaymentReceipt receipt : receiptsByFirst) {
                        if (receipt.getEmployeeName() != null && 
                            receipt.getEmployeeName().toUpperCase().contains(lastName)) {
                            if (!receiptsByName.contains(receipt)) {
                                receiptsByName.add(receipt);
                            }
                        }
                    }
                }
                
                matchedByName = receiptsByName.stream()
                    .filter(receipt -> {
                        if (receipt.getEmployeeName() == null) return false;
                        boolean exactMatch = verifyEmployeeNames(employeeName, receipt.getEmployeeName());
                        boolean flexibleMatch = isFlexibleNameMatch(employeeName, receipt.getEmployeeName());
                        boolean normalizedMatch = normalizeNameForSearch(receipt.getEmployeeName())
                            .contains(normalizedName) || normalizedName.contains(normalizeNameForSearch(receipt.getEmployeeName()));
                        return exactMatch || flexibleMatch || normalizedMatch;
                    })
                    .collect(Collectors.toList());
            }
            
            List<PaymentReceipt> uniqueReceipts = deduplicateReceiptsByDateCompanyAndEmployee(matchedByName);
            
            if (uniqueReceipts.isEmpty()) {
                log.warn("âŒ Comprovante nÃ£o encontrado para {} - {}/{}", employeeName, month, year);
                return false;
            }
            
            boolean allNamesMatch = uniqueReceipts.stream()
                .allMatch(receipt -> verifyEmployeeNames(employeeName, receipt.getEmployeeName()));
            
            if (!allNamesMatch && (forceUnification == null || !forceUnification)) {
                log.warn("âŒ Nomes nÃ£o coincidem para {} - {}/{}", employeeName, month, year);
                return false;
            }
            
            // Buscar arquivos PDF dos comprovantes
            List<String> receiptPaths = new ArrayList<>();
            for (PaymentReceipt receipt : uniqueReceipts) {
                String receiptPath = findReceiptOriginalFileByNameAndPeriod(
                    receipt.getEmployeeName(), 
                    receipt.getMonth(),
                    receipt.getYear(),
                    new java.util.ArrayList<>()
                );
                
                if (receiptPath == null || !Files.exists(Paths.get(receiptPath))) {
                    int nextMonth = receipt.getMonth() == 12 ? 1 : receipt.getMonth() + 1;
                    int nextYear = receipt.getMonth() == 12 ? receipt.getYear() + 1 : receipt.getYear();
                    receiptPath = findReceiptOriginalFileByNameAndPeriod(
                        receipt.getEmployeeName(),
                        nextMonth,
                        nextYear,
                        new java.util.ArrayList<>()
                    );
                }
                
                if (receiptPath == null || !Files.exists(Paths.get(receiptPath))) {
                    int prevMonth = receipt.getMonth() == 1 ? 12 : receipt.getMonth() - 1;
                    int prevYear = receipt.getMonth() == 1 ? receipt.getYear() - 1 : receipt.getYear();
                    receiptPath = findReceiptOriginalFileByNameAndPeriod(
                        receipt.getEmployeeName(),
                        prevMonth,
                        prevYear,
                        new java.util.ArrayList<>()
                    );
                }
                
                if (receiptPath == null || !Files.exists(Paths.get(receiptPath))) {
                    receiptPath = findReceiptOriginalFileByNameOnly(receipt.getEmployeeName(), new java.util.ArrayList<>());
                }
                
                if (receiptPath != null && Files.exists(Paths.get(receiptPath))) {
                    receiptPaths.add(receiptPath);
                }
            }
            
            if (receiptPaths.isEmpty()) {
                log.warn("âŒ PDFs dos comprovantes nÃ£o encontrados para {} - {}/{}", employeeName, month, year);
                return false;
            }
            
            // Extrair nome do funcionÃ¡rio e verificar correspondÃªncia antes de criar documento unificado
            // (implementaÃ§Ã£o similar Ã  unificaÃ§Ã£o individual)
            String finalEmployeeName = employeeName; // Fallback
            // TODO: Implementar extraÃ§Ã£o de nomes se necessÃ¡rio neste contexto
            
            // Criar documento unificado
            String unifiedPath = createUnifiedPdfUsingMerger(
                holeritePath, 
                receiptPaths, 
                finalEmployeeName, 
                month, 
                year,
                null, // payslip nÃ£o disponÃ­vel neste contexto
                null  // receipt nÃ£o disponÃ­vel neste contexto
            );
            
            log.info("âœ… Documento unificado criado: {}", unifiedPath);
            return true;
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao processar documento {} - {}/{}: {}", employeeName, month, year, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Busca um job por ID
     */
    @Transactional(readOnly = true)
    public com.z7design.fleet_manager.model.UnificationJob getJobById(UUID jobId) {
        return unificationJobRepository.findById(jobId)
            .orElseThrow(() -> new RuntimeException("Job nÃ£o encontrado: " + jobId));
    }

    /**
     * Cancela um job em processamento
     */
    @Transactional
    public void cancelJob(UUID jobId) {
        com.z7design.fleet_manager.model.UnificationJob job = unificationJobRepository.findById(jobId)
            .orElseThrow(() -> new RuntimeException("Job nÃ£o encontrado: " + jobId));
        
        if (job.getStatus() == com.z7design.fleet_manager.model.UnificationJob.JobStatus.PROCESSING) {
            job.setStatus(com.z7design.fleet_manager.model.UnificationJob.JobStatus.CANCELLED);
            job.setCompletedAt(LocalDateTime.now());
            unificationJobRepository.save(job);
            log.info("âœ… Job {} cancelado", jobId);
        } else {
            throw new IllegalStateException("Job nÃ£o pode ser cancelado. Status atual: " + job.getStatus());
        }
    }

    // ===== PROCESSAMENTO ASSÃNCRONO DE EXCLUSÃƒO =====

    /**
     * Cria um job de exclusÃ£o em lote e retorna imediatamente
     */
    @Transactional
    public com.z7design.fleet_manager.model.DeletionJob createDeletionJob(
            List<String> fileNames, UUID createdBy) {
        
        log.info("ðŸ—‘ï¸ Criando job de exclusÃ£o em lote: {} arquivo(s)", fileNames.size());
        
        // Salvar lista de arquivos como JSON
        String fileNamesJson;
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            fileNamesJson = mapper.writeValueAsString(fileNames);
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao serializar lista de arquivos: {}", e.getMessage());
            fileNamesJson = "[]";
        }
        
        com.z7design.fleet_manager.model.DeletionJob job = com.z7design.fleet_manager.model.DeletionJob.builder()
            .status(com.z7design.fleet_manager.model.DeletionJob.JobStatus.PENDING)
            .totalFiles(fileNames.size())
            .processedFiles(0)
            .deletedCount(0)
            .failedCount(0)
            .fileNames(fileNamesJson)
            .createdBy(createdBy)
            .build();
        
        job = deletionJobRepository.save(job);
        log.info("âœ… Job de exclusÃ£o criado: {} ({} arquivos)", job.getId(), fileNames.size());
        
        // Iniciar processamento assÃ­ncrono
        processDeletionJobAsync(job.getId());
        
        return job;
    }

    /**
     * Processa um job de exclusÃ£o em lote de forma assÃ­ncrona
     */
    @Async
    @Transactional
    public void processDeletionJobAsync(UUID jobId) {
        log.info("ðŸ—‘ï¸ Iniciando processamento assÃ­ncrono do job de exclusÃ£o: {}", jobId);
        
        com.z7design.fleet_manager.model.DeletionJob job = deletionJobRepository.findById(jobId)
            .orElseThrow(() -> new RuntimeException("Job de exclusÃ£o nÃ£o encontrado: " + jobId));
        
        try {
            // Atualizar status para PROCESSING
            job.setStatus(com.z7design.fleet_manager.model.DeletionJob.JobStatus.PROCESSING);
            job.setStartedAt(LocalDateTime.now());
            deletionJobRepository.save(job);
            
            long startTime = System.currentTimeMillis();
            
            // Parsear lista de arquivos
            List<String> fileNames;
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                fileNames = mapper.readValue(job.getFileNames(), 
                    mapper.getTypeFactory().constructCollectionType(List.class, String.class));
            } catch (Exception e) {
                log.error("ðŸ’¥ Erro ao parsear lista de arquivos: {}", e.getMessage());
                throw new RuntimeException("Erro ao parsear lista de arquivos", e);
            }
            
            int deletedCount = 0;
            int failedCount = 0;
            List<String> failedFiles = new ArrayList<>();
            
            // Processar exclusÃµes em paralelo (usando stream paralelo para melhor performance)
            log.info("ðŸ—‘ï¸ Processando {} arquivo(s) para exclusÃ£o...", fileNames.size());
            
            for (int i = 0; i < fileNames.size(); i++) {
                String fileName = fileNames.get(i);
                
                // Verificar se job foi cancelado
                job = deletionJobRepository.findById(jobId).orElse(null);
                if (job == null || job.getStatus() == com.z7design.fleet_manager.model.DeletionJob.JobStatus.CANCELLED) {
                    log.info("âš ï¸ Job de exclusÃ£o foi cancelado. Parando processamento.");
                    break;
                }
                
                try {
                    if (deleteUnifiedDocument(fileName)) {
                        deletedCount++;
                        log.debug("âœ… Arquivo excluÃ­do: {} ({}/{})", fileName, i + 1, fileNames.size());
                    } else {
                        failedCount++;
                        failedFiles.add(fileName);
                        log.warn("âš ï¸ Falha ao excluir arquivo: {} ({}/{})", fileName, i + 1, fileNames.size());
                    }
                } catch (Exception e) {
                    failedCount++;
                    failedFiles.add(fileName);
                    log.error("ðŸ’¥ Erro ao excluir arquivo {}: {}", fileName, e.getMessage());
                }
                
                // Atualizar progresso a cada 10 arquivos ou no final
                if ((i + 1) % 10 == 0 || (i + 1) == fileNames.size()) {
                    job.setProcessedFiles(i + 1);
                    job.setDeletedCount(deletedCount);
                    job.setFailedCount(failedCount);
                    deletionJobRepository.save(job);
                    log.info("ðŸ“Š Progresso: {}/{} processados, {} excluÃ­dos, {} falhas", 
                        i + 1, fileNames.size(), deletedCount, failedCount);
                }
            }
            
            // Finalizar job
            long endTime = System.currentTimeMillis();
            job.setStatus(com.z7design.fleet_manager.model.DeletionJob.JobStatus.COMPLETED);
            job.setProcessedFiles(fileNames.size());
            job.setDeletedCount(deletedCount);
            job.setFailedCount(failedCount);
            job.setProcessingTimeMs(endTime - startTime);
            job.setCompletedAt(LocalDateTime.now());
            
            if (failedCount > 0) {
                job.setErrorMessage(String.format("%d arquivo(s) nÃ£o puderam ser excluÃ­dos: %s", 
                    failedCount, String.join(", ", failedFiles.subList(0, Math.min(10, failedFiles.size())))));
            }
            
            deletionJobRepository.save(job);
            
            log.info("âœ… Job de exclusÃ£o concluÃ­do: {} ({} excluÃ­dos, {} falhas, {}ms)", 
                jobId, deletedCount, failedCount, endTime - startTime);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao processar job de exclusÃ£o {}: {}", jobId, e.getMessage(), e);
            job.setStatus(com.z7design.fleet_manager.model.DeletionJob.JobStatus.FAILED);
            job.setErrorMessage("Erro ao processar exclusÃ£o: " + e.getMessage());
            job.setCompletedAt(LocalDateTime.now());
            deletionJobRepository.save(job);
        }
    }

    /**
     * Busca um job de exclusÃ£o por ID
     */
    public com.z7design.fleet_manager.model.DeletionJob getDeletionJobById(UUID jobId) {
        return deletionJobRepository.findById(jobId)
            .orElseThrow(() -> new RuntimeException("Job de exclusÃ£o nÃ£o encontrado: " + jobId));
    }

    /**
     * Cancela um job de exclusÃ£o em processamento
     */
    @Transactional
    public void cancelDeletionJob(UUID jobId) {
        com.z7design.fleet_manager.model.DeletionJob job = deletionJobRepository.findById(jobId)
            .orElseThrow(() -> new RuntimeException("Job de exclusÃ£o nÃ£o encontrado: " + jobId));
        
        if (job.getStatus() == com.z7design.fleet_manager.model.DeletionJob.JobStatus.PROCESSING) {
            job.setStatus(com.z7design.fleet_manager.model.DeletionJob.JobStatus.CANCELLED);
            job.setCompletedAt(LocalDateTime.now());
            deletionJobRepository.save(job);
            log.info("âœ… Job de exclusÃ£o {} cancelado", jobId);
        } else {
            throw new IllegalStateException("Job nÃ£o pode ser cancelado. Status atual: " + job.getStatus());
        }
    }
} 
