package com.z7design.fleet_manager.service;

import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.z7design.fleet_manager.dto.ReportLayoutConfig;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Company.CompanyStatus;
import com.z7design.fleet_manager.model.Invoice;
import com.z7design.fleet_manager.model.enums.ExpenseStatus;
import com.z7design.fleet_manager.model.enums.ExpenseType;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import com.z7design.fleet_manager.dto.ContasAPagarCustomReportRequestDTO;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFRow;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContasAPagarReportService {
    
    private final InvoiceService invoiceService;
    private final ReportTemplateService reportTemplateService;
    private final StandardReportLayoutService standardReportLayoutService;
    private final CompanyRepository companyRepository;
    
    /**
     * Gera relatÃ³rio de contas a pagar por perÃ­odo
     */
    public String generateContasAPagarReport(LocalDate startDate, LocalDate endDate) {
        log.info("Gerando relatÃ³rio de contas a pagar para perÃ­odo: {} a {}", startDate, endDate);
        
        try {
            // Buscar todas as contas no perÃ­odo
            List<Invoice> invoices = invoiceService.findByDueDateBetween(startDate, endDate);
            
            // Preparar dados para o template
            Map<String, Object> reportData = prepareReportData(invoices, startDate, endDate);
            
            // Gerar relatÃ³rio completo
            String report = reportTemplateService.generateFullReport("contas-a-pagar", reportData);
            
            log.info("RelatÃ³rio gerado com sucesso para {} contas", invoices.size());
            return report;
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio de contas a pagar: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar relatÃ³rio: " + e.getMessage(), e);
        }
    }
    
    /**
     * Gera relatÃ³rio de contas a pagar por status
     */
    public String generateContasAPagarReportByStatus(ExpenseStatus status) {
        log.info("Gerando relatÃ³rio de contas a pagar por status: {}", status);
        
        try {
            List<Invoice> invoices = invoiceService.findByStatus(status);
            
            Map<String, Object> reportData = prepareReportData(invoices, null, null);
            reportData.put("reportTitle", "RelatÃ³rio de Contas " + getStatusDisplayName(status));
            
            String report = reportTemplateService.generateFullReport("contas-a-pagar", reportData);
            
            log.info("RelatÃ³rio por status gerado com sucesso para {} contas", invoices.size());
            return report;
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio por status: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar relatÃ³rio: " + e.getMessage(), e);
        }
    }
    
    /**
     * Gera relatÃ³rio PDF de contas a pagar por status com layout padrÃ£o
     */
    public byte[] generateContasAPagarReportPDFByStatus(ExpenseStatus status) throws IOException {
        log.info("Gerando relatÃ³rio PDF de contas a pagar por status: {} com layout padrÃ£o", status);
        
        try {
            List<Invoice> invoices = invoiceService.findByStatus(status);
            log.info("Dados obtidos: {} contas a pagar", invoices.size());
            
            return generateContasAPagarReportPDFWithIText(invoices, null, null, status, null);
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio PDF de contas a pagar por status", e);
            throw new IOException("Erro ao gerar relatÃ³rio de contas a pagar: " + e.getMessage(), e);
        }
    }
    
    /**
     * Gera relatÃ³rio de contas a pagar por tipo
     */
    public String generateContasAPagarReportByType(ExpenseType type) {
        log.info("Gerando relatÃ³rio de contas a pagar por tipo: {}", type);
        
        try {
            List<Invoice> invoices = invoiceService.findByType(type);
            
            Map<String, Object> reportData = prepareReportData(invoices, null, null);
            reportData.put("reportTitle", "RelatÃ³rio de " + getTypeDisplayName(type));
            
            String report = reportTemplateService.generateFullReport("contas-a-pagar", reportData);
            
            log.info("RelatÃ³rio por tipo gerado com sucesso para {} contas", invoices.size());
            return report;
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio por tipo: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar relatÃ³rio: " + e.getMessage(), e);
        }
    }
    
    /**
     * Gera relatÃ³rio PDF de contas a pagar por tipo com layout padrÃ£o
     */
    public byte[] generateContasAPagarReportPDFByType(ExpenseType type) throws IOException {
        log.info("Gerando relatÃ³rio PDF de contas a pagar por tipo: {} com layout padrÃ£o", type);
        
        try {
            List<Invoice> invoices = invoiceService.findByType(type);
            log.info("Dados obtidos: {} contas a pagar", invoices.size());
            
            return generateContasAPagarReportPDFWithIText(invoices, null, null, null, type);
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio PDF de contas a pagar por tipo", e);
            throw new IOException("Erro ao gerar relatÃ³rio de contas a pagar: " + e.getMessage(), e);
        }
    }
    
    /**
     * Gera relatÃ³rio resumido de contas a pagar
     */
    public String generateContasAPagarSummaryReport() {
        log.info("Gerando relatÃ³rio resumido de contas a pagar");
        
        try {
            List<Invoice> allInvoices = invoiceService.findAll();
            
            Map<String, Object> reportData = prepareSummaryData(allInvoices);
            
            String report = reportTemplateService.generateFullReport("contas-a-pagar", reportData);
            
            log.info("RelatÃ³rio resumido gerado com sucesso");
            return report;
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio resumido: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar relatÃ³rio: " + e.getMessage(), e);
        }
    }
    
    /**
     * Gera relatÃ³rio PDF resumido de contas a pagar com layout padrÃ£o
     */
    public byte[] generateContasAPagarSummaryReportPDF() throws IOException {
        log.info("Gerando relatÃ³rio PDF resumido de contas a pagar com layout padrÃ£o");
        
        try {
            List<Invoice> allInvoices = invoiceService.findAll();
            log.info("Dados obtidos: {} contas a pagar", allInvoices.size());
            
            return generateContasAPagarReportPDFWithITextResumo(allInvoices);
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio PDF resumido de contas a pagar", e);
            throw new IOException("Erro ao gerar relatÃ³rio de contas a pagar: " + e.getMessage(), e);
        }
    }
    
    /**
     * Gera relatÃ³rio PDF resumido de contas a pagar usando iText com layout padrÃ£o
     */
    private byte[] generateContasAPagarReportPDFWithITextResumo(List<Invoice> invoices) throws IOException {
        log.info("Gerando relatÃ³rio PDF resumido de contas a pagar com iText - {} contas", invoices.size());
        
        // Determinar companyId - usar primeira empresa ativa
        java.util.UUID companyId = null;
        List<Company> activeCompanies = companyRepository.findByStatus(CompanyStatus.ACTIVE);
        if (activeCompanies != null && !activeCompanies.isEmpty()) {
            companyId = activeCompanies.get(0).getId();
            log.info("Usando primeira empresa ativa: {} (ID: {})", 
                    activeCompanies.get(0).getName(), companyId);
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
            
            // Criar documento com layout padrÃ£o - tÃ­tulo para relatÃ³rio resumido
            ReportLayoutConfig layoutConfig = ReportLayoutConfig.builder()
                .companyId(companyId)
                .reportTitle("RELATÃ“RIO RESUMO - CONTAS A PAGAR")
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
            
            // EstatÃ­sticas
            BigDecimal totalAmount = invoices.stream()
                    .map(Invoice::getAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            long contasAbertas = invoices.stream()
                    .filter(i -> i.getStatus() == ExpenseStatus.PENDENTE)
                    .count();
            long contasPagas = invoices.stream()
                    .filter(i -> i.getStatus() == ExpenseStatus.PAGA)
                    .count();
            long contasVencidas = invoices.stream()
                    .filter(i -> i.getStatus() == ExpenseStatus.PENDENTE && 
                               i.getDueDate() != null && 
                               i.getDueDate().isBefore(LocalDate.now()))
                    .count();
            
            Paragraph stats = new Paragraph(String.format(
                    "Total de contas: %d | Abertas: %d | Pagas: %d | Vencidas: %d | Valor Total: R$ %s",
                    invoices.size(), contasAbertas, contasPagas, contasVencidas,
                    totalAmount.setScale(2, java.math.RoundingMode.HALF_UP).toString().replace(".", ",")))
                    .setFontSize(12)
                    .setBold()
                    .setMarginBottom(15);
            document.add(stats);
            
            // Tabela de contas
            if (invoices.isEmpty()) {
                Paragraph noData = new Paragraph("Nenhuma conta a pagar encontrada.")
                        .setTextAlignment(TextAlignment.CENTER)
                        .setFontSize(12)
                        .setMarginTop(20);
                document.add(noData);
            } else {
                Table table = new Table(7).setWidth(UnitValue.createPercentValue(100));
                
                // CabeÃ§alhos
                table.addHeaderCell(createHeaderCell("Vencimento"));
                table.addHeaderCell(createHeaderCell("Fornecedor"));
                table.addHeaderCell(createHeaderCell("DescriÃ§Ã£o"));
                table.addHeaderCell(createHeaderCell("Tipo"));
                table.addHeaderCell(createHeaderCell("Valor"));
                table.addHeaderCell(createHeaderCell("Status"));
                table.addHeaderCell(createHeaderCell("NÂº Fatura"));
                
                // Dados
                DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                for (Invoice invoice : invoices) {
                    table.addCell(createCell(invoice.getDueDate() != null ? invoice.getDueDate().format(dateFormatter) : ""));
                    table.addCell(createCell(invoice.getSupplier() != null ? invoice.getSupplier().getName() : "NÃ£o informado"));
                    
                    // DescriÃ§Ã£o (truncar se muito longa)
                    String desc = invoice.getDescription() != null ? invoice.getDescription() : "";
                    if (desc.length() > 40) {
                        desc = desc.substring(0, 37) + "...";
                    }
                    table.addCell(createCell(desc));
                    
                    table.addCell(createCell(getTypeDisplayName(invoice.getType())));
                    table.addCell(createCell(invoice.getAmount() != null ? 
                            "R$ " + invoice.getAmount().setScale(2, java.math.RoundingMode.HALF_UP).toString().replace(".", ",") : ""));
                    table.addCell(createCell(getStatusDisplayName(invoice.getStatus())));
                    table.addCell(createCell(invoice.getInvoiceNumber() != null ? invoice.getInvoiceNumber() : ""));
                }
                
                document.add(table);
            }
            
            // Finalizar layout padrÃ£o (adiciona header/footer em todas as pÃ¡ginas)
            standardReportLayoutService.finalizeDocumentLayout(docWithPdf);
            
            document.close();
            
        } catch (Exception e) {
            log.error("Erro ao gerar PDF de contas a pagar: {}", e.getMessage(), e);
            throw new IOException("Erro ao gerar relatÃ³rio PDF: " + e.getMessage(), e);
        }
        
        byte[] result = baos.toByteArray();
        log.info("PDF resumido de contas a pagar gerado com sucesso, tamanho: {} bytes", result.length);
        return result;
    }
    
    /**
     * Gera relatÃ³rio PDF de contas a pagar por empresa (sigla) com layout padrÃ£o
     */
    public byte[] generateContasAPagarReportPDFByCompany(String companySigla, 
                                                         LocalDate startDate, 
                                                         LocalDate endDate) throws IOException {
        log.info("Gerando relatÃ³rio PDF de contas a pagar por empresa: {} com layout padrÃ£o", companySigla);
        
        try {
            List<Invoice> allInvoices;
            if (startDate != null && endDate != null) {
                allInvoices = invoiceService.findByDueDateBetween(startDate, endDate);
            } else {
                allInvoices = invoiceService.findAll();
            }
            
            // Filtrar por empresa (sigla)
            List<Invoice> invoices = allInvoices.stream()
                    .filter(i -> i.getCompanySigla() != null && i.getCompanySigla().equalsIgnoreCase(companySigla))
                    .collect(Collectors.toList());
            
            log.info("Dados obtidos: {} contas a pagar para empresa {}", invoices.size(), companySigla);
            
            return generateContasAPagarReportPDFWithITextByCompany(invoices, startDate, endDate, companySigla);
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio PDF de contas a pagar por empresa", e);
            throw new IOException("Erro ao gerar relatÃ³rio de contas a pagar: " + e.getMessage(), e);
        }
    }
    
    /**
     * Gera relatÃ³rio PDF de contas a pagar com layout padrÃ£o (versÃ£o com tÃ­tulo personalizado por empresa)
     */
    private byte[] generateContasAPagarReportPDFWithITextByCompany(List<Invoice> invoices,
                                                                   LocalDate startDate, 
                                                                   LocalDate endDate,
                                                                   String companySigla) throws IOException {
        log.info("Gerando relatÃ³rio PDF de contas a pagar com iText - {} contas para empresa {}", invoices.size(), companySigla);
        
        // Determinar companyId - usar primeira empresa ativa
        java.util.UUID companyId = null;
        List<Company> activeCompanies = companyRepository.findByStatus(CompanyStatus.ACTIVE);
        if (activeCompanies != null && !activeCompanies.isEmpty()) {
            companyId = activeCompanies.get(0).getId();
            log.info("Usando primeira empresa ativa: {} (ID: {})", 
                    activeCompanies.get(0).getName(), companyId);
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
            
            // Criar documento com layout padrÃ£o - tÃ­tulo personalizado para relatÃ³rio por empresa
            ReportLayoutConfig layoutConfig = ReportLayoutConfig.builder()
                .companyId(companyId)
                .reportTitle("RELATÃ“RIO POR EMPRESA - CONTAS A PAGAR")
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
            
            // InformaÃ§Ã£o da empresa filtrada
            Paragraph companyInfo = new Paragraph("Empresa: " + companySigla)
                    .setFontSize(12)
                    .setBold()
                    .setMarginBottom(10);
            document.add(companyInfo);
            
            // Filtros aplicados
            if (startDate != null || endDate != null) {
                Paragraph filtersInfo = new Paragraph("Filtros aplicados:")
                        .setFontSize(10)
                        .setBold()
                        .setMarginBottom(5);
                document.add(filtersInfo);
                
                if (startDate != null && endDate != null) {
                    document.add(new Paragraph("PerÃ­odo: " + startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) +
                            " a " + endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).setFontSize(10).setMarginBottom(2));
                }
                document.add(new Paragraph("").setMarginBottom(10));
            }
            
            // EstatÃ­sticas
            BigDecimal totalAmount = invoices.stream()
                    .map(Invoice::getAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            long contasAbertas = invoices.stream()
                    .filter(i -> i.getStatus() == ExpenseStatus.PENDENTE)
                    .count();
            long contasPagas = invoices.stream()
                    .filter(i -> i.getStatus() == ExpenseStatus.PAGA)
                    .count();
            long contasVencidas = invoices.stream()
                    .filter(i -> i.getStatus() == ExpenseStatus.PENDENTE && 
                               i.getDueDate() != null && 
                               i.getDueDate().isBefore(LocalDate.now()))
                    .count();
            
            Paragraph stats = new Paragraph(String.format(
                    "Total de contas: %d | Abertas: %d | Pagas: %d | Vencidas: %d | Valor Total: R$ %s",
                    invoices.size(), contasAbertas, contasPagas, contasVencidas,
                    totalAmount.setScale(2, java.math.RoundingMode.HALF_UP).toString().replace(".", ",")))
                    .setFontSize(12)
                    .setBold()
                    .setMarginBottom(15);
            document.add(stats);
            
            // Tabela de contas
            if (invoices.isEmpty()) {
                Paragraph noData = new Paragraph("Nenhuma conta a pagar encontrada com os filtros aplicados.")
                        .setTextAlignment(TextAlignment.CENTER)
                        .setFontSize(12)
                        .setMarginTop(20);
                document.add(noData);
            } else {
                Table table = new Table(7).setWidth(UnitValue.createPercentValue(100));
                
                // CabeÃ§alhos
                table.addHeaderCell(createHeaderCell("Vencimento"));
                table.addHeaderCell(createHeaderCell("Fornecedor"));
                table.addHeaderCell(createHeaderCell("DescriÃ§Ã£o"));
                table.addHeaderCell(createHeaderCell("Tipo"));
                table.addHeaderCell(createHeaderCell("Valor"));
                table.addHeaderCell(createHeaderCell("Status"));
                table.addHeaderCell(createHeaderCell("NÂº Fatura"));
                
                // Dados
                DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                for (Invoice invoice : invoices) {
                    table.addCell(createCell(invoice.getDueDate() != null ? invoice.getDueDate().format(dateFormatter) : ""));
                    table.addCell(createCell(invoice.getSupplier() != null ? invoice.getSupplier().getName() : "NÃ£o informado"));
                    
                    // DescriÃ§Ã£o (truncar se muito longa)
                    String desc = invoice.getDescription() != null ? invoice.getDescription() : "";
                    if (desc.length() > 40) {
                        desc = desc.substring(0, 37) + "...";
                    }
                    table.addCell(createCell(desc));
                    
                    table.addCell(createCell(getTypeDisplayName(invoice.getType())));
                    table.addCell(createCell(invoice.getAmount() != null ? 
                            "R$ " + invoice.getAmount().setScale(2, java.math.RoundingMode.HALF_UP).toString().replace(".", ",") : ""));
                    table.addCell(createCell(getStatusDisplayName(invoice.getStatus())));
                    table.addCell(createCell(invoice.getInvoiceNumber() != null ? invoice.getInvoiceNumber() : ""));
                }
                
                document.add(table);
            }
            
            // Finalizar layout padrÃ£o (adiciona header/footer em todas as pÃ¡ginas)
            standardReportLayoutService.finalizeDocumentLayout(docWithPdf);
            
            document.close();
            
        } catch (Exception e) {
            log.error("Erro ao gerar PDF de contas a pagar: {}", e.getMessage(), e);
            throw new IOException("Erro ao gerar relatÃ³rio PDF: " + e.getMessage(), e);
        }
        
        byte[] result = baos.toByteArray();
        log.info("PDF de contas a pagar gerado com sucesso, tamanho: {} bytes", result.length);
        return result;
    }
    
    /**
     * Gera relatÃ³rio PDF de contas a pagar com layout padrÃ£o
     */
    public byte[] generateContasAPagarReportPDF(LocalDate startDate, LocalDate endDate, 
                                               ExpenseStatus statusFilter, ExpenseType typeFilter) throws IOException {
        log.info("Gerando relatÃ³rio PDF de contas a pagar com layout padrÃ£o - PerÃ­odo: {} a {}, Status: {}, Tipo: {}", 
                startDate, endDate, statusFilter, typeFilter);
        
        try {
            // Buscar dados com filtros
            List<Invoice> invoices;
            if (startDate != null && endDate != null) {
                invoices = invoiceService.findByDueDateBetween(startDate, endDate);
            } else {
                invoices = invoiceService.findAll();
            }
            
            // Aplicar filtros adicionais
            if (statusFilter != null) {
                invoices = invoices.stream()
                        .filter(i -> i.getStatus() == statusFilter)
                        .collect(Collectors.toList());
            }
            
            if (typeFilter != null) {
                invoices = invoices.stream()
                        .filter(i -> i.getType() == typeFilter)
                        .collect(Collectors.toList());
            }
            
            log.info("Dados obtidos: {} contas a pagar", invoices.size());
            
            return generateContasAPagarReportPDFWithIText(invoices, startDate, endDate, statusFilter, typeFilter);
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio PDF de contas a pagar", e);
            throw new IOException("Erro ao gerar relatÃ³rio de contas a pagar: " + e.getMessage(), e);
        }
    }
    
    /**
     * Gera relatÃ³rio PDF de contas a pagar usando iText com layout padrÃ£o
     */
    private byte[] generateContasAPagarReportPDFWithIText(List<Invoice> invoices,
                                                         LocalDate startDate, 
                                                         LocalDate endDate,
                                                         ExpenseStatus statusFilter,
                                                         ExpenseType typeFilter) throws IOException {
        log.info("Gerando relatÃ³rio PDF de contas a pagar com iText - {} contas", invoices.size());
        
        // Determinar companyId - usar primeira empresa ativa
        java.util.UUID companyId = null;
        List<Company> activeCompanies = companyRepository.findByStatus(CompanyStatus.ACTIVE);
        if (activeCompanies != null && !activeCompanies.isEmpty()) {
            companyId = activeCompanies.get(0).getId();
            log.info("Usando primeira empresa ativa: {} (ID: {})", 
                    activeCompanies.get(0).getName(), companyId);
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
                .reportTitle("RELATÃ“RIO DE CONTAS A PAGAR")
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
            if (startDate != null || endDate != null || statusFilter != null || typeFilter != null) {
                Paragraph filtersInfo = new Paragraph("Filtros aplicados:")
                        .setFontSize(10)
                        .setBold()
                        .setMarginBottom(5);
                document.add(filtersInfo);
                
                if (startDate != null && endDate != null) {
                    document.add(new Paragraph("PerÃ­odo: " + startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) +
                            " a " + endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).setFontSize(10).setMarginBottom(2));
                }
                if (statusFilter != null) {
                    document.add(new Paragraph("Status: " + getStatusDisplayName(statusFilter)).setFontSize(10).setMarginBottom(2));
                }
                if (typeFilter != null) {
                    document.add(new Paragraph("Tipo: " + getTypeDisplayName(typeFilter)).setFontSize(10).setMarginBottom(2));
                }
                document.add(new Paragraph("").setMarginBottom(10));
            }
            
            // EstatÃ­sticas
            BigDecimal totalAmount = invoices.stream()
                    .map(Invoice::getAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            long contasAbertas = invoices.stream()
                    .filter(i -> i.getStatus() == ExpenseStatus.PENDENTE)
                    .count();
            long contasPagas = invoices.stream()
                    .filter(i -> i.getStatus() == ExpenseStatus.PAGA)
                    .count();
            long contasVencidas = invoices.stream()
                    .filter(i -> i.getStatus() == ExpenseStatus.PENDENTE && 
                               i.getDueDate() != null && 
                               i.getDueDate().isBefore(LocalDate.now()))
                    .count();
            
            Paragraph stats = new Paragraph(String.format(
                    "Total de contas: %d | Abertas: %d | Pagas: %d | Vencidas: %d | Valor Total: R$ %s",
                    invoices.size(), contasAbertas, contasPagas, contasVencidas,
                    totalAmount.setScale(2, java.math.RoundingMode.HALF_UP).toString().replace(".", ",")))
                    .setFontSize(12)
                    .setBold()
                    .setMarginBottom(15);
            document.add(stats);
            
            // Tabela de contas
            if (invoices.isEmpty()) {
                Paragraph noData = new Paragraph("Nenhuma conta a pagar encontrada com os filtros aplicados.")
                        .setTextAlignment(TextAlignment.CENTER)
                        .setFontSize(12)
                        .setMarginTop(20);
                document.add(noData);
            } else {
                Table table = new Table(7).setWidth(UnitValue.createPercentValue(100));
                
                // CabeÃ§alhos
                table.addHeaderCell(createHeaderCell("Vencimento"));
                table.addHeaderCell(createHeaderCell("Fornecedor"));
                table.addHeaderCell(createHeaderCell("DescriÃ§Ã£o"));
                table.addHeaderCell(createHeaderCell("Tipo"));
                table.addHeaderCell(createHeaderCell("Valor"));
                table.addHeaderCell(createHeaderCell("Status"));
                table.addHeaderCell(createHeaderCell("NÂº Fatura"));
                
                // Dados
                DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                for (Invoice invoice : invoices) {
                    table.addCell(createCell(invoice.getDueDate() != null ? invoice.getDueDate().format(dateFormatter) : ""));
                    table.addCell(createCell(invoice.getSupplier() != null ? invoice.getSupplier().getName() : "NÃ£o informado"));
                    
                    // DescriÃ§Ã£o (truncar se muito longa)
                    String desc = invoice.getDescription() != null ? invoice.getDescription() : "";
                    if (desc.length() > 40) {
                        desc = desc.substring(0, 37) + "...";
                    }
                    table.addCell(createCell(desc));
                    
                    table.addCell(createCell(getTypeDisplayName(invoice.getType())));
                    table.addCell(createCell(invoice.getAmount() != null ? 
                            "R$ " + invoice.getAmount().setScale(2, java.math.RoundingMode.HALF_UP).toString().replace(".", ",") : ""));
                    table.addCell(createCell(getStatusDisplayName(invoice.getStatus())));
                    table.addCell(createCell(invoice.getInvoiceNumber() != null ? invoice.getInvoiceNumber() : ""));
                }
                
                document.add(table);
            }
            
            // Finalizar layout padrÃ£o (adiciona header/footer em todas as pÃ¡ginas)
            standardReportLayoutService.finalizeDocumentLayout(docWithPdf);
            
            document.close();
            
        } catch (Exception e) {
            log.error("Erro ao gerar PDF de contas a pagar: {}", e.getMessage(), e);
            throw new IOException("Erro ao gerar relatÃ³rio PDF: " + e.getMessage(), e);
        }
        
        byte[] result = baos.toByteArray();
        log.info("PDF de contas a pagar gerado com sucesso, tamanho: {} bytes", result.length);
        return result;
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
     * Prepara dados para o template de relatÃ³rio
     */
    private Map<String, Object> prepareReportData(List<Invoice> invoices, LocalDate startDate, LocalDate endDate) {
        Map<String, Object> data = new HashMap<>();
        
        // Dados bÃ¡sicos
        data.put("reportDate", LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        data.put("currentDate", LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        data.put("pageNumber", "1");
        
        if (startDate != null && endDate != null) {
            data.put("startDate", startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            data.put("endDate", endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        }
        
        // EstatÃ­sticas
        int totalContas = invoices.size();
        BigDecimal valorTotal = invoices.stream()
                .map(Invoice::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        long contasAbertas = invoices.stream()
                .filter(i -> i.getStatus() == ExpenseStatus.PENDENTE)
                .count();
        
        long contasPagas = invoices.stream()
                .filter(i -> i.getStatus() == ExpenseStatus.PAGA)
                .count();
        
        long contasVencidas = invoices.stream()
                .filter(i -> i.getStatus() == ExpenseStatus.PENDENTE && 
                           i.getDueDate() != null && 
                           i.getDueDate().isBefore(LocalDate.now()))
                .count();
        
        data.put("totalContas", totalContas);
        data.put("valorTotal", formatCurrency(valorTotal));
        data.put("contasAbertas", contasAbertas);
        data.put("contasPagas", contasPagas);
        data.put("contasVencidas", contasVencidas);
        
        // Percentuais
        if (totalContas > 0) {
            data.put("percentualAbertas", String.format("%.1f", (contasAbertas * 100.0) / totalContas));
            data.put("percentualPagas", String.format("%.1f", (contasPagas * 100.0) / totalContas));
            data.put("percentualVencidas", String.format("%.1f", (contasVencidas * 100.0) / totalContas));
        } else {
            data.put("percentualAbertas", "0.0");
            data.put("percentualPagas", "0.0");
            data.put("percentualVencidas", "0.0");
        }
        
        // Dados das contas para a tabela
        List<Map<String, Object>> contasData = invoices.stream()
                .map(this::mapInvoiceToReportData)
                .collect(Collectors.toList());
        
        data.put("contas", contasData);
        
        return data;
    }
    
    /**
     * Prepara dados resumidos
     */
    private Map<String, Object> prepareSummaryData(List<Invoice> invoices) {
        Map<String, Object> data = prepareReportData(invoices, null, null);
        data.put("reportTitle", "RelatÃ³rio Resumido de Contas a Pagar");
        
        // AnÃ¡lise por fornecedor
        Map<String, Long> contasPorFornecedor = invoices.stream()
                .filter(i -> i.getSupplier() != null)
                .collect(Collectors.groupingBy(
                        i -> i.getSupplier().getName(),
                        Collectors.counting()
                ));
        
        data.put("contasPorFornecedor", contasPorFornecedor);
        
        return data;
    }
    
    /**
     * Mapeia uma invoice para dados do relatÃ³rio
     */
    private Map<String, Object> mapInvoiceToReportData(Invoice invoice) {
        Map<String, Object> invoiceData = new HashMap<>();
        
        invoiceData.put("vencimento", invoice.getDueDate() != null ? 
                invoice.getDueDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "-");
        invoiceData.put("fornecedor", invoice.getSupplier() != null ? 
                invoice.getSupplier().getName() : "NÃ£o informado");
        invoiceData.put("descricao", invoice.getDescription() != null ? 
                invoice.getDescription() : "-");
        invoiceData.put("tipo", getTypeDisplayName(invoice.getType()));
        invoiceData.put("valor", formatCurrency(invoice.getAmount()));
        invoiceData.put("status", getStatusDisplayName(invoice.getStatus()));
        
        return invoiceData;
    }
    
    /**
     * Formata valor monetÃ¡rio
     */
    private String formatCurrency(BigDecimal value) {
        if (value == null) return "R$ 0,00";
        return String.format("R$ %,.2f", value).replace(",", "X").replace(".", ",").replace("X", ".");
    }
    
    /**
     * ObtÃ©m nome de exibiÃ§Ã£o do status
     */
    private String getStatusDisplayName(ExpenseStatus status) {
        if (status == null) return "NÃ£o definido";
        
        return switch (status) {
            case PENDENTE -> "Aberta";
            case PAGA -> "Paga";
            case CANCELADA -> "Cancelada";
            case ERRO -> "Erro";
            case SOLICITADA -> "Solicitada";
            case PAGA_ANTERIORMENTE -> "Paga Anteriormente";
            case PENDENTE_ERRO -> "Pendente/Erro";
        };
    }
    
    /**
     * Obtém nome de exibição do tipo
     */
    private String getTypeDisplayName(ExpenseType type) {
        if (type == null) return "Não definido";
        
        return switch (type) {
            case FIXA -> "Fixa";
            case VARIAVEL -> "Variável";
        };
    }

    /**
     * Filtra faturas conforme os critérios customizados do usuário
     */
    public List<Invoice> filterCustomInvoices(ContasAPagarCustomReportRequestDTO request) {
        List<Invoice> all = invoiceService.findAll();
        LocalDate now = LocalDate.now();

        return all.stream().filter(inv -> {
            // 1. Data Base
            LocalDate baseDate = inv.getDueDate();
            if ("EMISSAO".equalsIgnoreCase(request.getDateBase()) && inv.getIssueDate() != null) {
                baseDate = inv.getIssueDate();
            } else if ("PAGAMENTO".equalsIgnoreCase(request.getDateBase()) && inv.getPaymentDate() != null) {
                baseDate = inv.getPaymentDate();
            }

            if (request.getStartDate() != null && baseDate != null && baseDate.isBefore(request.getStartDate())) {
                return false;
            }
            if (request.getEndDate() != null && baseDate != null && baseDate.isAfter(request.getEndDate())) {
                return false;
            }

            // Vencendo em breve (7, 15, 30 dias)
            if (request.getDueSoonRange() != null && !request.getDueSoonRange().equalsIgnoreCase("ALL") && !"QUALQUER".equalsIgnoreCase(request.getDueSoonRange())) {
                try {
                    int days = Integer.parseInt(request.getDueSoonRange());
                    if (inv.getDueDate() == null) return false;
                    LocalDate limit = now.plusDays(days);
                    if (inv.getDueDate().isBefore(now) || inv.getDueDate().isAfter(limit)) {
                        return false;
                    }
                } catch (NumberFormatException ignored) {}
            }

            // 2. Filtros Corporativos
            if (request.getCompanySigla() != null && !request.getCompanySigla().equalsIgnoreCase("TODAS") && !request.getCompanySigla().isBlank()) {
                String sigla = inv.getCompanySigla();
                if (sigla == null || !sigla.equalsIgnoreCase(request.getCompanySigla().trim())) {
                    return false;
                }
            }

            if (request.getWorkSector() != null && !request.getWorkSector().equalsIgnoreCase("TODOS") && !request.getWorkSector().isBlank()) {
                String centro = inv.getCentroCusto();
                if (centro == null || !centro.toLowerCase().contains(request.getWorkSector().trim().toLowerCase())) {
                    return false;
                }
            }

            if (request.getStatus() != null && !request.getStatus().equalsIgnoreCase("TODOS") && !request.getStatus().isBlank()) {
                String reqStatus = request.getStatus().toUpperCase();
                if ("VENCIDA".equals(reqStatus)) {
                    if (inv.getStatus() != ExpenseStatus.PENDENTE || inv.getDueDate() == null || !inv.getDueDate().isBefore(now)) {
                        return false;
                    }
                } else if (inv.getStatus() == null || !inv.getStatus().name().equalsIgnoreCase(reqStatus)) {
                    return false;
                }
            }

            if (request.getExpenseType() != null && !request.getExpenseType().equalsIgnoreCase("TODOS") && !request.getExpenseType().isBlank()) {
                if (inv.getType() == null || !inv.getType().name().equalsIgnoreCase(request.getExpenseType().trim())) {
                    return false;
                }
            }

            if (request.getSupplierName() != null && !request.getSupplierName().equalsIgnoreCase("TODOS") && !request.getSupplierName().isBlank()) {
                String sName = inv.getSupplierName();
                if (sName == null || !sName.toLowerCase().contains(request.getSupplierName().trim().toLowerCase())) {
                    return false;
                }
            }

            return true;
        }).sorted(Comparator.comparing(Invoice::getDueDate, Comparator.nullsLast(Comparator.naturalOrder())))
          .collect(Collectors.toList());
    }

    /**
     * Gera relatório Excel customizado com as colunas e filtros escolhidos
     */
    public byte[] generateCustomExcelReport(ContasAPagarCustomReportRequestDTO request) throws IOException {
        List<Invoice> invoices = filterCustomInvoices(request);
        List<String> selectedCols = (request.getColumns() != null && !request.getColumns().isEmpty())
                ? request.getColumns()
                : List.of("due_date", "description", "supplier", "value", "status");

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            XSSFSheet sheet = workbook.createSheet("Contas a Pagar");

            // Estilos
            XSSFCellStyle headerStyle = workbook.createCellStyle();
            XSSFFont headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);

            XSSFCellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);

            // Cabeçalho das colunas
            XSSFRow headerRow = sheet.createRow(0);
            for (int i = 0; i < selectedCols.size(); i++) {
                String col = selectedCols.get(i);
                headerRow.createCell(i).setCellValue(getColumnHeaderLabel(col));
                headerRow.getCell(i).setCellStyle(headerStyle);
            }

            // Linhas de dados
            int rowIdx = 1;
            BigDecimal totalAmount = BigDecimal.ZERO;
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");

            for (Invoice inv : invoices) {
                XSSFRow row = sheet.createRow(rowIdx++);
                for (int colIdx = 0; colIdx < selectedCols.size(); colIdx++) {
                    String col = selectedCols.get(colIdx);
                    String val = getColumnValue(inv, col, dtf);
                    row.createCell(colIdx).setCellValue(val);
                    row.getCell(colIdx).setCellStyle(dataStyle);
                }
                if (inv.getAmount() != null) {
                    totalAmount = totalAmount.add(inv.getAmount());
                }
            }

            // Linha de total
            XSSFRow totalRow = sheet.createRow(rowIdx);
            XSSFCellStyle totalStyle = workbook.createCellStyle();
            XSSFFont totalFont = workbook.createFont();
            totalFont.setBold(true);
            totalStyle.setFont(totalFont);
            totalStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            totalStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            totalRow.createCell(0).setCellValue("TOTAL: " + invoices.size() + " contas - Total: " + formatCurrency(totalAmount));
            totalRow.getCell(0).setCellStyle(totalStyle);

            for (int i = 0; i < selectedCols.size(); i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(baos);
            return baos.toByteArray();
        }
    }

    /**
     * Gera relatório PDF customizado com as colunas, filtros e agrupamento definidos pelo usuário
     */
    public byte[] generateCustomPdfReport(ContasAPagarCustomReportRequestDTO request) throws IOException {
        List<Invoice> invoices = filterCustomInvoices(request);
        List<String> selectedCols = (request.getColumns() != null && !request.getColumns().isEmpty())
                ? request.getColumns()
                : List.of("due_date", "description", "supplier", "value", "status");

        java.util.UUID companyId = null;
        List<Company> activeCompanies = companyRepository.findByStatus(CompanyStatus.ACTIVE);
        if (activeCompanies != null && !activeCompanies.isEmpty()) {
            companyId = activeCompanies.get(0).getId();
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);

        ReportLayoutConfig layoutConfig = ReportLayoutConfig.builder()
                .companyId(companyId)
                .reportTitle("RELATÓRIO PERSONALIZADO DE CONTAS A PAGAR")
                .topMargin(110f)
                .bottomMargin(70f)
                .leftMargin(30f)
                .rightMargin(30f)
                .build();

        StandardReportLayoutService.DocumentWithPdf docWithPdf = standardReportLayoutService.createDocumentWithLayout(writer, layoutConfig);
        Document document = docWithPdf.getDocument();

        // Subtítulo e resumo dos filtros
        String periodoText = "Período: " + (request.getStartDate() != null ? request.getStartDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "Início") +
                " a " + (request.getEndDate() != null ? request.getEndDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "Atual");
        
        Paragraph info = new Paragraph(periodoText + " | Total de Registros: " + invoices.size())
                .setFontSize(9)
                .setMarginBottom(10);
        document.add(info);

        // Tabela com colunas dinâmicas
        float[] columnWidths = new float[selectedCols.size()];
        Arrays.fill(columnWidths, 1f);
        Table table = new Table(UnitValue.createPercentArray(columnWidths)).useAllAvailableWidth();

        // Header da tabela
        for (String col : selectedCols) {
            table.addHeaderCell(new Paragraph(getColumnHeaderLabel(col)).setBold().setFontSize(8));
        }

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        BigDecimal totalVal = BigDecimal.ZERO;

        for (Invoice inv : invoices) {
            for (String col : selectedCols) {
                String val = getColumnValue(inv, col, dtf);
                table.addCell(new Paragraph(val).setFontSize(7.5f));
            }
            if (inv.getAmount() != null) {
                totalVal = totalVal.add(inv.getAmount());
            }
        }

        document.add(table);

        Paragraph sumP = new Paragraph("\nTotal Geral: " + formatCurrency(totalVal) + " (" + invoices.size() + " despesas listadas)")
                .setBold()
                .setFontSize(10)
                .setTextAlignment(TextAlignment.RIGHT);
        document.add(sumP);

        document.close();
        return baos.toByteArray();
    }

    private String getColumnHeaderLabel(String col) {
        return switch (col.toLowerCase()) {
            case "due_date", "datadevencimento", "vencimento" -> "Vencimento";
            case "issue_date", "datadeemissao", "emissao" -> "Emissão";
            case "payment_date", "datadepagamento", "pagamento" -> "Pagamento";
            case "description", "descricaodadespesa", "descricao" -> "Descrição";
            case "supplier", "fornecedor" -> "Fornecedor";
            case "company", "empresa", "sigla" -> "Empresa";
            case "unit", "unidade" -> "Unidade";
            case "work_sector", "setor", "setordetrabalho" -> "Setor / Obra";
            case "category", "conta", "contacategoria" -> "Categoria";
            case "cost_center", "centrodecusto" -> "Centro Custo";
            case "type", "tipofixavariavel" -> "Tipo";
            case "amount", "valor", "valorr$" -> "Valor (R$)";
            case "status" -> "Status";
            case "barcode", "codigodebarras" -> "Cód. Barras";
            case "notes", "observacoes" -> "Observações";
            default -> col;
        };
    }

    private String getColumnValue(Invoice inv, String col, DateTimeFormatter dtf) {
        return switch (col.toLowerCase()) {
            case "due_date", "datadevencimento", "vencimento" -> inv.getDueDate() != null ? inv.getDueDate().format(dtf) : "-";
            case "issue_date", "datadeemissao", "emissao" -> inv.getIssueDate() != null ? inv.getIssueDate().format(dtf) : "-";
            case "payment_date", "datadepagamento", "pagamento" -> inv.getPaymentDate() != null ? inv.getPaymentDate().format(dtf) : "-";
            case "description", "descricaodadespesa", "descricao" -> inv.getDescription() != null ? inv.getDescription() : "-";
            case "supplier", "fornecedor" -> inv.getSupplierName() != null ? inv.getSupplierName() : "-";
            case "company", "empresa", "sigla" -> inv.getCompanySigla() != null ? inv.getCompanySigla() : "-";
            case "unit", "unidade" -> "Central";
            case "work_sector", "setor", "setordetrabalho" -> inv.getCentroCusto() != null ? inv.getCentroCusto() : "-";
            case "category", "conta", "contacategoria" -> inv.getCategory() != null ? inv.getCategory() : "-";
            case "cost_center", "centrodecusto" -> inv.getCentroCusto() != null ? inv.getCentroCusto() : "-";
            case "type", "tipofixavariavel" -> getTypeDisplayName(inv.getType());
            case "amount", "valor", "valorr$" -> formatCurrency(inv.getAmount());
            case "status" -> getStatusDisplayName(inv.getStatus());
            case "barcode", "codigodebarras" -> inv.getBarcode() != null ? inv.getBarcode() : (inv.getLinhaDigitavel() != null ? inv.getLinhaDigitavel() : "-");
            case "notes", "observacoes" -> inv.getNotes() != null ? inv.getNotes() : "-";
            default -> "-";
        };
    }
}

