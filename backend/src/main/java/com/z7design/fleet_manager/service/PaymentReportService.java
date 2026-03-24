package com.z7design.fleet_manager.service;

import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.z7design.fleet_manager.dto.AccountsReceivableReportDTO;
import com.z7design.fleet_manager.dto.ReportLayoutConfig;
import com.z7design.fleet_manager.dto.ScheduledPaymentReportDTO;
import com.z7design.fleet_manager.model.AccountsReceivable;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Company.CompanyStatus;
import com.z7design.fleet_manager.model.ScheduledPayment;
import com.z7design.fleet_manager.model.enums.ReceivableStatus;
import com.z7design.fleet_manager.model.enums.ScheduledPaymentStatus;
import com.z7design.fleet_manager.repository.AccountsReceivableRepository;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.ScheduledPaymentRepository;
import com.z7design.fleet_manager.service.StandardReportLayoutService;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PaymentReportService {
    
    private final AccountsReceivableRepository accountsReceivableRepository;
    private final ScheduledPaymentRepository scheduledPaymentRepository;
    private final JasperReportService jasperReportService;
    private final StandardReportLayoutService standardReportLayoutService;
    private final CompanyRepository companyRepository;
    
    /**
     * Gerar relatÃ³rio de contas a receber
     */
    public byte[] generateAccountsReceivableReportPDF(LocalDate startDate, 
                                                     LocalDate endDate, 
                                                     String clientFilter, 
                                                     String statusFilter,
                                                     String categoryFilter,
                                                     String paymentMethodFilter,
                                                     BigDecimal amountMin,
                                                     BigDecimal amountMax,
                                                     List<String> selectedIds) throws IOException {
        log.info("Gerando relatÃ³rio PDF de contas a receber com layout padrÃ£o - PerÃ­odo: {} a {}, Cliente: {}, Status: {}, Categoria: {}, MÃ©todo: {}, Valor: {} a {}, IDs: {}", 
                startDate, endDate, clientFilter, statusFilter, categoryFilter, paymentMethodFilter, amountMin, amountMax, selectedIds);
        
        try {
            // Buscar dados com filtros
            List<AccountsReceivable> accounts = getAccountsReceivableFiltered(
                    startDate, endDate, clientFilter, statusFilter, categoryFilter, 
                    paymentMethodFilter, amountMin, amountMax, selectedIds);
            
            log.info("Dados obtidos: {} contas a receber", accounts.size());
            
            // Usar iText com layout padrÃ£o
            return generateAccountsReceivableReportPDFWithIText(
                    accounts, startDate, endDate, clientFilter, statusFilter, 
                    categoryFilter, paymentMethodFilter, amountMin, amountMax);
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio PDF de contas a receber", e);
            throw new IOException("Erro ao gerar relatÃ³rio de contas a receber: " + e.getMessage(), e);
        }
    }
    
    /**
     * Gera relatÃ³rio PDF de contas a receber usando iText com layout padrÃ£o
     */
    private byte[] generateAccountsReceivableReportPDFWithIText(List<AccountsReceivable> accounts,
                                                               LocalDate startDate, 
                                                               LocalDate endDate, 
                                                               String clientFilter, 
                                                               String statusFilter,
                                                               String categoryFilter,
                                                               String paymentMethodFilter,
                                                               BigDecimal amountMin,
                                                               BigDecimal amountMax) throws IOException {
        log.info("Gerando relatÃ³rio PDF de contas a receber com iText - {} contas", accounts.size());
        
        // Determinar companyId - usar primeira empresa ativa como fallback
        java.util.UUID companyId = null;
        List<Company> activeCompaniesList = companyRepository.findByStatus(CompanyStatus.ACTIVE);
        if (activeCompaniesList != null && !activeCompaniesList.isEmpty()) {
            companyId = activeCompaniesList.get(0).getId();
            log.info("Usando primeira empresa ativa: {} (ID: {})", 
                    activeCompaniesList.get(0).getName(), companyId);
        } else {
            List<Company> allCompanies = companyRepository.findAll();
            if (allCompanies != null && !allCompanies.isEmpty()) {
                companyId = allCompanies.get(0).getId();
                log.warn("Nenhuma empresa ativa encontrada. Usando primeira empresa cadastrada: {} (ID: {})", 
                        allCompanies.get(0).getName(), companyId);
            } else {
                throw new ResourceNotFoundException("NÃ£o foi possÃ­vel determinar a empresa para o relatÃ³rio. " +
                        "Nenhuma empresa cadastrada no sistema. Por favor, cadastre pelo menos uma empresa.");
            }
        }
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        StandardReportLayoutService.DocumentWithPdf docWithPdf = null;
        
        try {
            PdfWriter writer = new PdfWriter(baos);
            
            // Criar documento com layout padrÃ£o
            ReportLayoutConfig layoutConfig = ReportLayoutConfig.builder()
                .companyId(companyId)
                .reportTitle("RELATÃ“RIO DE CONTAS A RECEBER")
                .topMargin(120f)  // EspaÃ§o para cabeÃ§alho
                .bottomMargin(80f) // EspaÃ§o para rodapÃ©
                .leftMargin(50f)
                .rightMargin(50f)
                .build();
            
            docWithPdf = standardReportLayoutService.createDocumentWithLayout(writer, layoutConfig);
            Document document = docWithPdf.getDocument();
            
            // InformaÃ§Ãµes do relatÃ³rio
            Paragraph reportInfo = new Paragraph("Gerado em: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")))
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setFontSize(10)
                    .setMarginBottom(10);
            document.add(reportInfo);
            
            // Filtros aplicados
            if (startDate != null || endDate != null || clientFilter != null || statusFilter != null || 
                categoryFilter != null || paymentMethodFilter != null || amountMin != null || amountMax != null) {
                if (startDate != null && endDate != null) {
                    document.add(new Paragraph("PerÃ­odo: " + startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + 
                            " a " + endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).setFontSize(10).setMarginBottom(2));
                }
                if (clientFilter != null && !clientFilter.isEmpty()) {
                    document.add(new Paragraph("Cliente: " + clientFilter).setFontSize(10).setMarginBottom(2));
                }
                if (statusFilter != null && !statusFilter.isEmpty() && !statusFilter.equals("ALL")) {
                    document.add(new Paragraph("Status: " + statusFilter).setFontSize(10).setMarginBottom(2));
                }
                if (categoryFilter != null && !categoryFilter.isEmpty() && !categoryFilter.equals("ALL")) {
                    document.add(new Paragraph("Categoria: " + categoryFilter).setFontSize(10).setMarginBottom(2));
                }
                if (paymentMethodFilter != null && !paymentMethodFilter.isEmpty() && !paymentMethodFilter.equals("ALL")) {
                    document.add(new Paragraph("MÃ©todo de Pagamento: " + paymentMethodFilter).setFontSize(10).setMarginBottom(2));
                }
                if (amountMin != null || amountMax != null) {
                    String amountRange = "Valor: ";
                    if (amountMin != null) amountRange += "R$ " + amountMin.setScale(2, java.math.RoundingMode.HALF_UP).toString().replace(".", ",");
                    if (amountMin != null && amountMax != null) amountRange += " a ";
                    if (amountMax != null) amountRange += "R$ " + amountMax.setScale(2, java.math.RoundingMode.HALF_UP).toString().replace(".", ",");
                    document.add(new Paragraph(amountRange).setFontSize(10).setMarginBottom(2));
                }
                document.add(new Paragraph("").setMarginBottom(10));
            }
            
            // EstatÃ­sticas
            BigDecimal totalAmount = accounts.stream()
                    .map(AccountsReceivable::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalPending = accounts.stream()
                    .filter(a -> a.getStatus() != null && 
                            (a.getStatus() == ReceivableStatus.PENDING || a.getStatus() == ReceivableStatus.OVERDUE))
                    .map(AccountsReceivable::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            Paragraph stats = new Paragraph(String.format(
                    "Total de contas: %d | Valor Total: R$ %s | Valor Pendente: R$ %s",
                    accounts.size(), 
                    totalAmount.setScale(2, java.math.RoundingMode.HALF_UP).toString().replace(".", ","),
                    totalPending.setScale(2, java.math.RoundingMode.HALF_UP).toString().replace(".", ",")))
                    .setFontSize(12)
                    .setBold()
                    .setMarginBottom(15);
            document.add(stats);
            
            // Tabela de contas
            if (accounts.isEmpty()) {
                Paragraph noData = new Paragraph("Nenhuma conta a receber encontrada com os filtros aplicados.")
                        .setTextAlignment(TextAlignment.CENTER)
                        .setFontSize(12)
                        .setMarginTop(20);
                document.add(noData);
            } else {
                Table table = new Table(8).setWidth(UnitValue.createPercentValue(100));
                
                // CabeÃ§alhos
                table.addHeaderCell(createHeaderCell("Cliente"));
                table.addHeaderCell(createHeaderCell("NÂº Fatura"));
                table.addHeaderCell(createHeaderCell("EmissÃ£o"));
                table.addHeaderCell(createHeaderCell("Vencimento"));
                table.addHeaderCell(createHeaderCell("Valor"));
                table.addHeaderCell(createHeaderCell("Status"));
                table.addHeaderCell(createHeaderCell("Categoria"));
                table.addHeaderCell(createHeaderCell("MÃ©todo"));
                
                // Dados
                DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                for (AccountsReceivable account : accounts) {
                    table.addCell(createCell(account.getClient() != null ? account.getClient().getName() : ""));
                    table.addCell(createCell(account.getInvoiceNumber() != null ? account.getInvoiceNumber() : ""));
                    table.addCell(createCell(account.getIssueDate() != null ? account.getIssueDate().format(dateFormatter) : ""));
                    table.addCell(createCell(account.getDueDate() != null ? account.getDueDate().format(dateFormatter) : ""));
                    table.addCell(createCell(account.getAmount() != null ? 
                            "R$ " + account.getAmount().setScale(2, java.math.RoundingMode.HALF_UP).toString().replace(".", ",") : ""));
                    table.addCell(createCell(account.getStatus() != null ? getStatusLabel(account.getStatus()) : ""));
                    table.addCell(createCell(account.getCategory() != null ? account.getCategory().toString() : ""));
                    table.addCell(createCell(account.getPaymentMethod() != null ? account.getPaymentMethod().toString() : ""));
                }
                
                document.add(table);
            }
            
            // Finalizar layout padrÃ£o (adiciona header/footer em todas as pÃ¡ginas)
            standardReportLayoutService.finalizeDocumentLayout(docWithPdf);
            
            document.close();
            
        } catch (Exception e) {
            log.error("Erro ao gerar PDF de contas a receber: {}", e.getMessage(), e);
            throw new IOException("Erro ao gerar relatÃ³rio PDF: " + e.getMessage(), e);
        }
        
        byte[] result = baos.toByteArray();
        log.info("PDF de contas a receber gerado com sucesso, tamanho: {} bytes", result.length);
        return result;
    }
    
    private String getStatusLabel(ReceivableStatus status) {
        if (status == null) return "";
        return switch (status) {
            case PENDING -> "Pendente";
            case PAID -> "Pago";
            case OVERDUE -> "Vencido";
            case CANCELLED -> "Cancelado";
            case PARTIAL -> "Parcial";
        };
    }
    
    private com.itextpdf.layout.element.Cell createHeaderCell(String text) {
        return new com.itextpdf.layout.element.Cell()
                .add(new Paragraph(text).setBold().setFontSize(10))
                .setTextAlignment(TextAlignment.CENTER)
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY);
    }
    
    private com.itextpdf.layout.element.Cell createCell(String text) {
        return new com.itextpdf.layout.element.Cell()
                .add(new Paragraph(text != null ? text : "").setFontSize(9))
                .setTextAlignment(TextAlignment.LEFT);
    }
    
    /**
     * Gerar relatÃ³rio de pagamentos agendados
     */
    public byte[] generateScheduledPaymentReportPDF(LocalDate startDate, 
                                                   LocalDate endDate, 
                                                   String clientFilter, 
                                                   String statusFilter,
                                                   String paymentMethodFilter,
                                                   BigDecimal amountMin,
                                                   BigDecimal amountMax,
                                                   List<String> selectedIds) throws IOException {
        log.info("Gerando relatÃ³rio PDF de pagamentos agendados com layout padrÃ£o - PerÃ­odo: {} a {}, Cliente: {}, Status: {}, MÃ©todo: {}, Valor: {} a {}, IDs: {}", 
                startDate, endDate, clientFilter, statusFilter, paymentMethodFilter, amountMin, amountMax, selectedIds);
        
        try {
            // Buscar dados com filtros
            List<ScheduledPayment> payments = getScheduledPaymentsFiltered(
                    startDate, endDate, clientFilter, statusFilter, 
                    paymentMethodFilter, amountMin, amountMax, selectedIds);
            
            log.info("Dados obtidos: {} pagamentos agendados", payments.size());
            
            // Usar iText com layout padrÃ£o
            return generateScheduledPaymentReportPDFWithIText(
                    payments, startDate, endDate, clientFilter, statusFilter, 
                    paymentMethodFilter, amountMin, amountMax);
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio PDF de pagamentos agendados", e);
            throw new IOException("Erro ao gerar relatÃ³rio de pagamentos agendados: " + e.getMessage(), e);
        }
    }
    
    /**
     * Gera relatÃ³rio PDF de pagamentos agendados usando iText com layout padrÃ£o
     */
    private byte[] generateScheduledPaymentReportPDFWithIText(List<ScheduledPayment> payments,
                                                             LocalDate startDate, 
                                                             LocalDate endDate, 
                                                             String clientFilter, 
                                                             String statusFilter,
                                                             String paymentMethodFilter,
                                                             BigDecimal amountMin,
                                                             BigDecimal amountMax) throws IOException {
        log.info("Gerando relatÃ³rio PDF de pagamentos agendados com iText - {} pagamentos", payments.size());
        
        // Determinar companyId - usar primeira empresa ativa como fallback
        java.util.UUID companyId = null;
        List<Company> activeCompaniesList2 = companyRepository.findByStatus(CompanyStatus.ACTIVE);
        if (activeCompaniesList2 != null && !activeCompaniesList2.isEmpty()) {
            companyId = activeCompaniesList2.get(0).getId();
            log.info("Usando primeira empresa ativa: {} (ID: {})", 
                    activeCompaniesList2.get(0).getName(), companyId);
        } else {
            List<Company> allCompanies = companyRepository.findAll();
            if (allCompanies != null && !allCompanies.isEmpty()) {
                companyId = allCompanies.get(0).getId();
                log.warn("Nenhuma empresa ativa encontrada. Usando primeira empresa cadastrada: {} (ID: {})", 
                        allCompanies.get(0).getName(), companyId);
            } else {
                throw new ResourceNotFoundException("NÃ£o foi possÃ­vel determinar a empresa para o relatÃ³rio. " +
                        "Nenhuma empresa cadastrada no sistema. Por favor, cadastre pelo menos uma empresa.");
            }
        }
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        StandardReportLayoutService.DocumentWithPdf docWithPdf = null;
        
        try {
            PdfWriter writer = new PdfWriter(baos);
            
            // Criar documento com layout padrÃ£o
            ReportLayoutConfig layoutConfig = ReportLayoutConfig.builder()
                .companyId(companyId)
                .reportTitle("RELATÃ“RIO DE PAGAMENTOS AGENDADOS")
                .topMargin(120f)  // EspaÃ§o para cabeÃ§alho
                .bottomMargin(80f) // EspaÃ§o para rodapÃ©
                .leftMargin(50f)
                .rightMargin(50f)
                .build();
            
            docWithPdf = standardReportLayoutService.createDocumentWithLayout(writer, layoutConfig);
            Document document = docWithPdf.getDocument();
            
            // InformaÃ§Ãµes do relatÃ³rio
            Paragraph reportInfo = new Paragraph("Gerado em: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")))
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setFontSize(10)
                    .setMarginBottom(10);
            document.add(reportInfo);
            
            // Filtros aplicados
            if (startDate != null || endDate != null || clientFilter != null || statusFilter != null || 
                paymentMethodFilter != null || amountMin != null || amountMax != null) {
                if (startDate != null && endDate != null) {
                    document.add(new Paragraph("PerÃ­odo: " + startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + 
                            " a " + endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).setFontSize(10).setMarginBottom(2));
                }
                if (clientFilter != null && !clientFilter.isEmpty()) {
                    document.add(new Paragraph("Cliente: " + clientFilter).setFontSize(10).setMarginBottom(2));
                }
                if (statusFilter != null && !statusFilter.isEmpty() && !statusFilter.equals("ALL")) {
                    document.add(new Paragraph("Status: " + statusFilter).setFontSize(10).setMarginBottom(2));
                }
                if (paymentMethodFilter != null && !paymentMethodFilter.isEmpty() && !paymentMethodFilter.equals("ALL")) {
                    document.add(new Paragraph("MÃ©todo de Pagamento: " + paymentMethodFilter).setFontSize(10).setMarginBottom(2));
                }
                if (amountMin != null || amountMax != null) {
                    String amountRange = "Valor: ";
                    if (amountMin != null) amountRange += "R$ " + amountMin.setScale(2, java.math.RoundingMode.HALF_UP).toString().replace(".", ",");
                    if (amountMin != null && amountMax != null) amountRange += " a ";
                    if (amountMax != null) amountRange += "R$ " + amountMax.setScale(2, java.math.RoundingMode.HALF_UP).toString().replace(".", ",");
                    document.add(new Paragraph(amountRange).setFontSize(10).setMarginBottom(2));
                }
                document.add(new Paragraph("").setMarginBottom(10));
            }
            
            // EstatÃ­sticas
            BigDecimal totalAmount = payments.stream()
                    .map(ScheduledPayment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            long scheduledCount = payments.stream().filter(p -> p.getStatus() == ScheduledPaymentStatus.SCHEDULED).count();
            long executedCount = payments.stream().filter(p -> p.getStatus() == ScheduledPaymentStatus.EXECUTED).count();
            long cancelledCount = payments.stream().filter(p -> p.getStatus() == ScheduledPaymentStatus.CANCELLED).count();
            
            Paragraph stats = new Paragraph(String.format(
                    "Total de pagamentos: %d | Agendados: %d | Executados: %d | Cancelados: %d | Valor Total: R$ %s",
                    payments.size(), scheduledCount, executedCount, cancelledCount,
                    totalAmount.setScale(2, java.math.RoundingMode.HALF_UP).toString().replace(".", ",")))
                    .setFontSize(12)
                    .setBold()
                    .setMarginBottom(15);
            document.add(stats);
            
            // Tabela de pagamentos
            if (payments.isEmpty()) {
                Paragraph noData = new Paragraph("Nenhum pagamento agendado encontrado com os filtros aplicados.")
                        .setTextAlignment(TextAlignment.CENTER)
                        .setFontSize(12)
                        .setMarginTop(20);
                document.add(noData);
            } else {
                Table table = new Table(7).setWidth(UnitValue.createPercentValue(100));
                
                // CabeÃ§alhos
                table.addHeaderCell(createHeaderCell("Cliente"));
                table.addHeaderCell(createHeaderCell("Data Agendada"));
                table.addHeaderCell(createHeaderCell("Valor"));
                table.addHeaderCell(createHeaderCell("Status"));
                table.addHeaderCell(createHeaderCell("MÃ©todo"));
                table.addHeaderCell(createHeaderCell("DescriÃ§Ã£o"));
                table.addHeaderCell(createHeaderCell("ObservaÃ§Ãµes"));
                
                // Dados
                DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                for (ScheduledPayment payment : payments) {
                    table.addCell(createCell(payment.getClient() != null ? payment.getClient().getName() : ""));
                    table.addCell(createCell(payment.getScheduledDate() != null ? payment.getScheduledDate().format(dateFormatter) : ""));
                    table.addCell(createCell(payment.getAmount() != null ? 
                            "R$ " + payment.getAmount().setScale(2, java.math.RoundingMode.HALF_UP).toString().replace(".", ",") : ""));
                    table.addCell(createCell(payment.getStatus() != null ? getPaymentStatusLabel(payment.getStatus()) : ""));
                    table.addCell(createCell(payment.getPaymentMethod() != null ? payment.getPaymentMethod().toString() : ""));
                    
                    // DescriÃ§Ã£o (truncar se muito longa)
                    String desc = payment.getDescription() != null ? payment.getDescription() : "";
                    if (desc.length() > 40) {
                        desc = desc.substring(0, 37) + "...";
                    }
                    table.addCell(createCell(desc));
                    
                    // Notas (truncar se muito longa)
                    String notes = payment.getNotes() != null ? payment.getNotes() : "";
                    if (notes.length() > 40) {
                        notes = notes.substring(0, 37) + "...";
                    }
                    table.addCell(createCell(notes));
                }
                
                document.add(table);
            }
            
            // Finalizar layout padrÃ£o (adiciona header/footer em todas as pÃ¡ginas)
            standardReportLayoutService.finalizeDocumentLayout(docWithPdf);
            
            document.close();
            
        } catch (Exception e) {
            log.error("Erro ao gerar PDF de pagamentos agendados: {}", e.getMessage(), e);
            throw new IOException("Erro ao gerar relatÃ³rio PDF: " + e.getMessage(), e);
        }
        
        byte[] result = baos.toByteArray();
        log.info("PDF de pagamentos agendados gerado com sucesso, tamanho: {} bytes", result.length);
        return result;
    }
    
    private String getPaymentStatusLabel(ScheduledPaymentStatus status) {
        if (status == null) return "";
        return switch (status) {
            case SCHEDULED -> "Agendado";
            case EXECUTED -> "Executado";
            case CANCELLED -> "Cancelado";
            case OVERDUE -> "Vencido";
        };
    }
    
    /**
     * Buscar contas a receber com filtros
     */
    private List<AccountsReceivable> getAccountsReceivableFiltered(LocalDate startDate, 
                                                                  LocalDate endDate, 
                                                                  String clientFilter, 
                                                                  String statusFilter,
                                                                  String categoryFilter,
                                                                  String paymentMethodFilter,
                                                                  BigDecimal amountMin,
                                                                  BigDecimal amountMax,
                                                                  List<String> selectedIds) {
        List<AccountsReceivable> accounts = accountsReceivableRepository.findAll();
        log.info("Encontradas {} contas a receber no banco de dados", accounts.size());
        
        // Aplicar filtros
        return accounts.stream()
                .filter(account -> startDate == null || !account.getIssueDate().isBefore(startDate))
                .filter(account -> endDate == null || !account.getIssueDate().isAfter(endDate))
                .filter(account -> clientFilter == null || clientFilter.isEmpty() || 
                        account.getClient().getName().toLowerCase().contains(clientFilter.toLowerCase()))
                .filter(account -> statusFilter == null || statusFilter.isEmpty() || statusFilter.equals("ALL") || 
                        account.getStatus().toString().equals(statusFilter))
                .filter(account -> categoryFilter == null || categoryFilter.isEmpty() || categoryFilter.equals("ALL") || 
                        account.getCategory().toString().equals(categoryFilter))
                .filter(account -> paymentMethodFilter == null || paymentMethodFilter.isEmpty() || paymentMethodFilter.equals("ALL") || 
                        account.getPaymentMethod().toString().equals(paymentMethodFilter))
                .filter(account -> amountMin == null || account.getAmount().compareTo(amountMin) >= 0)
                .filter(account -> amountMax == null || account.getAmount().compareTo(amountMax) <= 0)
                .filter(account -> selectedIds == null || selectedIds.isEmpty() || 
                        selectedIds.contains(account.getId().toString()))
                .collect(Collectors.toList());
    }
    
    /**
     * Buscar pagamentos agendados com filtros
     */
    private List<ScheduledPayment> getScheduledPaymentsFiltered(LocalDate startDate, 
                                                               LocalDate endDate, 
                                                               String clientFilter, 
                                                               String statusFilter,
                                                               String paymentMethodFilter,
                                                               BigDecimal amountMin,
                                                               BigDecimal amountMax,
                                                               List<String> selectedIds) {
        List<ScheduledPayment> payments = scheduledPaymentRepository.findAll();
        log.info("Encontrados {} pagamentos agendados no banco de dados", payments.size());
        
        // Aplicar filtros
        return payments.stream()
                .filter(payment -> startDate == null || !payment.getScheduledDate().isBefore(startDate))
                .filter(payment -> endDate == null || !payment.getScheduledDate().isAfter(endDate))
                .filter(payment -> clientFilter == null || clientFilter.isEmpty() || 
                        payment.getClient().getName().toLowerCase().contains(clientFilter.toLowerCase()))
                .filter(payment -> statusFilter == null || statusFilter.isEmpty() || statusFilter.equals("ALL") || 
                        payment.getStatus().toString().equals(statusFilter))
                .filter(payment -> paymentMethodFilter == null || paymentMethodFilter.isEmpty() || paymentMethodFilter.equals("ALL") || 
                        payment.getPaymentMethod().toString().equals(paymentMethodFilter))
                .filter(payment -> amountMin == null || payment.getAmount().compareTo(amountMin) >= 0)
                .filter(payment -> amountMax == null || payment.getAmount().compareTo(amountMax) <= 0)
                .filter(payment -> selectedIds == null || selectedIds.isEmpty() || 
                        selectedIds.contains(payment.getId().toString()))
                .collect(Collectors.toList());
    }
    
    /**
     * Excluir mÃºltiplas contas a receber
     */
    @Transactional
    public void deleteMultipleAccountsReceivable(List<String> ids) {
        log.info("Excluindo {} contas a receber", ids.size());
        
        for (String id : ids) {
            try {
                accountsReceivableRepository.deleteById(java.util.UUID.fromString(id));
                log.info("Conta a receber excluÃ­da: {}", id);
            } catch (Exception e) {
                log.error("Erro ao excluir conta a receber {}: {}", id, e.getMessage());
            }
        }
        
        log.info("ExclusÃ£o mÃºltipla de contas a receber concluÃ­da");
    }
    
    /**
     * Excluir mÃºltiplos pagamentos agendados
     */
    @Transactional
    public void deleteMultipleScheduledPayments(List<String> ids) {
        log.info("Excluindo {} pagamentos agendados", ids.size());
        
        for (String id : ids) {
            try {
                scheduledPaymentRepository.deleteById(java.util.UUID.fromString(id));
                log.info("Pagamento agendado excluÃ­do: {}", id);
            } catch (Exception e) {
                log.error("Erro ao excluir pagamento agendado {}: {}", id, e.getMessage());
            }
        }
        
        log.info("ExclusÃ£o mÃºltipla de pagamentos agendados concluÃ­da");
    }
}

