package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.config.JasperReportsConfig;
import com.z7design.fleet_manager.dto.CompanyDTO;
import com.z7design.fleet_manager.dto.ProductDTO;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.InventoryItem;
import com.z7design.fleet_manager.model.FinancialTransaction;
import com.z7design.fleet_manager.exception.ReportGenerationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.sf.jasperreports.engine.*;
 
import org.springframework.stereotype.Service;
 
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.z7design.fleet_manager.model.KmControl;
import com.z7design.fleet_manager.dto.ReportLayoutConfig;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Company.CompanyStatus;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.service.StandardReportLayoutService;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import java.io.ByteArrayOutputStream;
// import com.z7design.fleet_manager.repository.KmControlRepository; // Importar KmControlRepository

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final JasperReportsConfig jasperReportsConfig;
    private final EmployeeService employeeService;
    private final CompanyService companyService;
    private final ProductService productService;
    private final InventoryItemService inventoryItemService;
    private final FinancialTransactionService financialTransactionService;
    // private final KmControlRepository kmControlRepository; // Injetar KmControlRepository (usado em relatÃ³rios de KM)
    private final com.z7design.fleet_manager.repository.PayrollRepository payrollRepository;
    private final com.z7design.fleet_manager.service.PayrollService payrollService;
    private final StandardReportLayoutService standardReportLayoutService;
    private final CompanyRepository companyRepository;

    /**
     * Gera relatÃ³rio de funcionÃ¡rios em PDF
     */
    public byte[] generateEmployeeReportPdf(Map<String, Object> filters) {
        try {
            List<Employee> employees = employeeService.findAll();
            Map<String, Object> parameters = createEmployeeReportParameters(filters);
            
            return jasperReportsConfig.generatePdfReport(
                "reports/employee_report.jrxml", 
                employees, 
                parameters
            );
        } catch (JRException | IOException e) {
            log.error("Erro ao gerar relatÃ³rio de funcionÃ¡rios em PDF", e);
            throw new ReportGenerationException("Erro ao gerar relatÃ³rio de funcionÃ¡rios", e);
        }
    }

    /**
     * Gera relatÃ³rio de funcionÃ¡rios em Excel
     */
    public byte[] generateEmployeeReportExcel(Map<String, Object> filters) {
        try {
            List<Employee> employees = employeeService.findAll();
            Map<String, Object> parameters = createEmployeeReportParameters(filters);
            
            return jasperReportsConfig.generateExcelReport(
                "reports/employee_report.jrxml", 
                employees, 
                parameters
            );
        } catch (JRException | IOException e) {
            log.error("Erro ao gerar relatÃ³rio de funcionÃ¡rios em Excel", e);
            throw new ReportGenerationException("Erro ao gerar relatÃ³rio de funcionÃ¡rios", e);
        }
    }

    /**
     * Gera relatÃ³rio de empresas em PDF
     */
    public byte[] generateCompanyReportPdf(Map<String, Object> filters) {
        try {
            List<CompanyDTO> companies = companyService.getAllCompanies();
            Map<String, Object> parameters = createCompanyReportParameters(filters);
            
            return jasperReportsConfig.generatePdfReport(
                "reports/company_report.jrxml", 
                companies, 
                parameters
            );
        } catch (JRException | IOException e) {
            log.error("Erro ao gerar relatÃ³rio de empresas em PDF", e);
            throw new ReportGenerationException("Erro ao gerar relatÃ³rio de empresas", e);
        }
    }

    /**
     * Gera relatÃ³rio de produtos em PDF
     */
    public byte[] generateProductReportPdf(Map<String, Object> filters) {
        try {
            List<ProductDTO> products = productService.getAllProducts();
            Map<String, Object> parameters = createProductReportParameters(filters);
            
            return jasperReportsConfig.generatePdfReport(
                "reports/product_report.jrxml", 
                products, 
                parameters
            );
        } catch (JRException | IOException e) {
            log.error("Erro ao gerar relatÃ³rio de produtos em PDF", e);
            throw new ReportGenerationException("Erro ao gerar relatÃ³rio de produtos", e);
        }
    }

    /**
     * Gera relatÃ³rio de estoque em PDF
     */
    public byte[] generateInventoryReportPdf(Map<String, Object> filters) {
        try {
            List<InventoryItem> items = inventoryItemService.findAll();
            Map<String, Object> parameters = createInventoryReportParameters(filters);
            
            return jasperReportsConfig.generatePdfReport(
                "reports/inventory_report.jrxml", 
                items, 
                parameters
            );
        } catch (JRException | IOException e) {
            log.error("Erro ao gerar relatÃ³rio de estoque em PDF", e);
            throw new ReportGenerationException("Erro ao gerar relatÃ³rio de estoque", e);
        }
    }

    /**
     * Gera relatÃ³rio financeiro em PDF com layout padrÃ£o
     */
    public byte[] generateFinancialReportPdf(Map<String, Object> filters) {
        try {
            log.info("Gerando relatÃ³rio financeiro em PDF com layout padrÃ£o");
            
            List<FinancialTransaction> transactions = financialTransactionService.findAll();
            
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
                    throw new ReportGenerationException("NÃ£o foi possÃ­vel determinar a empresa para o relatÃ³rio. " +
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
                    .reportTitle("RELATÃ“RIO FINANCEIRO")
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
                double totalIncome = transactions.stream()
                        .filter(t -> t.getType() != null && "INCOME".equalsIgnoreCase(t.getType()))
                        .mapToDouble(t -> t.getAmount() != null ? t.getAmount().doubleValue() : 0.0)
                        .sum();
                double totalExpense = transactions.stream()
                        .filter(t -> t.getType() != null && "EXPENSE".equalsIgnoreCase(t.getType()))
                        .mapToDouble(t -> t.getAmount() != null ? t.getAmount().doubleValue() : 0.0)
                        .sum();
                double balance = totalIncome - totalExpense;
                
                Paragraph stats = new Paragraph(String.format(
                        "Total de transaÃ§Ãµes: %d | Receitas: R$ %,.2f | Despesas: R$ %,.2f | Saldo: R$ %,.2f",
                        transactions.size(), totalIncome, totalExpense, balance))
                        .setFontSize(12)
                        .setBold()
                        .setMarginBottom(15);
                document.add(stats);
                
                // Tabela de transaÃ§Ãµes
                if (transactions.isEmpty()) {
                    Paragraph noData = new Paragraph("Nenhuma transaÃ§Ã£o financeira encontrada.")
                            .setTextAlignment(TextAlignment.CENTER)
                            .setFontSize(12)
                            .setMarginTop(20);
                    document.add(noData);
                } else {
                    Table table = new Table(6).setWidth(UnitValue.createPercentValue(100));
                    
                    // CabeÃ§alhos
                    table.addHeaderCell(createHeaderCell("Data"));
                    table.addHeaderCell(createHeaderCell("Tipo"));
                    table.addHeaderCell(createHeaderCell("DescriÃ§Ã£o"));
                    table.addHeaderCell(createHeaderCell("Valor"));
                    table.addHeaderCell(createHeaderCell("Status"));
                    table.addHeaderCell(createHeaderCell("Categoria"));
                    
                    // Dados
                    DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
                    for (FinancialTransaction transaction : transactions) {
                        table.addCell(createCell(transaction.getDate() != null ? 
                                transaction.getDate().format(dateFormatter) : ""));
                        table.addCell(createCell(transaction.getType() != null ? transaction.getType() : ""));
                        
                        // DescriÃ§Ã£o (truncar se muito longa)
                        String desc = transaction.getDescription() != null ? transaction.getDescription() : "";
                        if (desc.length() > 40) {
                            desc = desc.substring(0, 37) + "...";
                        }
                        table.addCell(createCell(desc));
                        
                        table.addCell(createCell(transaction.getAmount() != null ? 
                                String.format("R$ %,.2f", transaction.getAmount()).replace(",", "X").replace(".", ",").replace("X", ".") : ""));
                        table.addCell(createCell(transaction.getStatus() != null ? transaction.getStatus() : ""));
                        table.addCell(createCell(transaction.getCategory() != null ? transaction.getCategory() : ""));
                    }
                    
                    document.add(table);
                }
                
                // Finalizar layout padrÃ£o (adiciona header/footer em todas as pÃ¡ginas)
                standardReportLayoutService.finalizeDocumentLayout(docWithPdf);
                
                document.close();
                
            } catch (Exception e) {
                log.error("Erro ao gerar PDF financeiro: {}", e.getMessage(), e);
                throw new ReportGenerationException("Erro ao gerar relatÃ³rio financeiro: " + e.getMessage(), e);
            }
            
            byte[] result = baos.toByteArray();
            log.info("PDF financeiro gerado com sucesso, tamanho: {} bytes", result.length);
            return result;
            
        } catch (ReportGenerationException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio financeiro em PDF", e);
            throw new ReportGenerationException("Erro ao gerar relatÃ³rio financeiro", e);
        }
    }

    /**
     * Gera relatÃ³rio consolidado em PDF
     */
    public byte[] generateConsolidatedReportPdf(Map<String, Object> filters) {
        try {
            Map<String, Object> parameters = createConsolidatedReportParameters(filters);
            
            // Criar dados consolidados
            Map<String, Object> consolidatedData = new HashMap<>();
            consolidatedData.put("employees", employeeService.findAll());
            consolidatedData.put("companies", companyService.getAllCompanies());
            consolidatedData.put("products", productService.getAllProducts());
            consolidatedData.put("inventory", inventoryItemService.findAll());
            consolidatedData.put("transactions", financialTransactionService.findAll());
            
            return jasperReportsConfig.generatePdfReport(
                "reports/consolidated_report.jrxml", 
                List.of(consolidatedData), 
                parameters
            );
        } catch (JRException | IOException e) {
            log.error("Erro ao gerar relatÃ³rio consolidado em PDF", e);
            throw new ReportGenerationException("Erro ao gerar relatÃ³rio consolidado", e);
        }
    }

    /**
     * Gera relatÃ³rio de folha de pagamento em PDF
     */
    public byte[] generatePayrollReportPdf(String referenceMonth, UUID unitId, UUID employeeId) {
        try {
            Map<String, Object> parameters = jasperReportsConfig.createDefaultParameters();
            parameters.put("REFERENCE_MONTH", referenceMonth);
            if (unitId != null) parameters.put("UNIT_ID", unitId.toString());
            if (employeeId != null) parameters.put("EMPLOYEE_ID", employeeId.toString());

            // Montar dataset bÃ¡sico da folha
            List<com.z7design.fleet_manager.model.Payroll> data;
            if (employeeId != null && referenceMonth != null) {
                data = payrollService.findByEmployeeId(employeeId).stream()
                    .filter(p -> referenceMonth.equals(p.getReferenceMonth()))
                    .toList();
            } else if (unitId != null && referenceMonth != null) {
                data = payrollService.findByUnitId(unitId).stream()
                    .filter(p -> referenceMonth.equals(p.getReferenceMonth()))
                    .toList();
            } else if (referenceMonth != null) {
                data = payrollRepository.findByReferenceMonth(referenceMonth);
            } else {
                data = payrollService.findAll();
            }

            parameters.put("TOTAL_NET", data.stream().map(p -> p.getNetSalary() == null ? 0d : p.getNetSalary()).reduce(0d, Double::sum));

            return jasperReportsConfig.generatePdfReport(
                "reports/payroll_report.jrxml",
                data,
                parameters
            );
        } catch (JRException | IOException e) {
            log.error("Erro ao gerar relatÃ³rio de folha em PDF", e);
            throw new ReportGenerationException("Erro ao gerar relatÃ³rio de folha", e);
        }
    }

    /**
     * Gera relatÃ³rio de Controle de Quilometragem em PDF ou Excel
     */
    public byte[] generateKmControlReport(List<KmControl> kmControls, Map<String, Object> filters, String format) throws JRException, IOException {
        if ("pdf".equalsIgnoreCase(format)) {
            // Usar layout padrÃ£o para PDF
            return generateKmControlReportPDFWithIText(kmControls, filters);
        } else if ("xlsx".equalsIgnoreCase(format)) {
            // Excel ainda usa JasperReports
            Map<String, Object> parameters = createKmControlReportParameters(filters);
            return jasperReportsConfig.generateExcelReport("reports/km_control_report.jrxml", kmControls, parameters);
        } else {
            throw new IllegalArgumentException("Formato de relatÃ³rio invÃ¡lido: " + format);
        }
    }
    
    /**
     * Gera relatÃ³rio PDF de Controle de KM usando iText com layout padrÃ£o
     */
    private byte[] generateKmControlReportPDFWithIText(List<KmControl> kmControls, Map<String, Object> filters) throws IOException {
        log.info("Gerando relatÃ³rio PDF de Controle de KM com layout padrÃ£o - {} registros", kmControls.size());
        
        // Determinar companyId
        java.util.UUID companyId = null;
        if (!kmControls.isEmpty()) {
            for (KmControl kmControl : kmControls) {
                if (kmControl.getVehicle() != null && kmControl.getVehicle().getCompanyId() != null) {
                    companyId = kmControl.getVehicle().getCompanyId();
                    log.info("Usando empresa do veÃ­culo {}: {}", kmControl.getVehiclePlate(), companyId);
                    break;
                }
            }
        }
        
        // Fallback: usar primeira empresa ativa
        if (companyId == null) {
            log.warn("Nenhum registro possui empresa associada. Buscando primeira empresa ativa como fallback...");
            List<Company> activeCompanies = companyRepository.findByStatus(CompanyStatus.ACTIVE);
            if (activeCompanies != null && !activeCompanies.isEmpty()) {
                companyId = activeCompanies.get(0).getId();
                log.info("Usando primeira empresa ativa como fallback: {} (ID: {})", 
                        activeCompanies.get(0).getName(), companyId);
            } else {
                List<Company> allCompanies = companyRepository.findAll();
                if (allCompanies != null && !allCompanies.isEmpty()) {
                    companyId = allCompanies.get(0).getId();
                    log.warn("Nenhuma empresa ativa encontrada. Usando primeira empresa cadastrada: {} (ID: {})", 
                            allCompanies.get(0).getName(), companyId);
                } else {
                    throw new ReportGenerationException("NÃ£o foi possÃ­vel determinar a empresa para o relatÃ³rio. " +
                            "Nenhuma empresa cadastrada no sistema. Por favor, cadastre pelo menos uma empresa.");
                }
            }
        }
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        StandardReportLayoutService.DocumentWithPdf docWithPdf = null;
        
        try {
            PdfWriter writer = new PdfWriter(baos);
            
            // Criar documento com layout padrÃ£o
            ReportLayoutConfig layoutConfig = ReportLayoutConfig.builder()
                .companyId(companyId)
                .reportTitle("RELATÃ“RIO DE CONTROLE DE QUILOMETRAGEM")
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
            if (filters != null && !filters.isEmpty()) {
                if (filters.containsKey("startDate") || filters.containsKey("endDate")) {
                    String period = "";
                    if (filters.containsKey("startDate")) {
                        period = filters.get("startDate").toString();
                    }
                    if (filters.containsKey("endDate")) {
                        if (!period.isEmpty()) period += " a ";
                        period += filters.get("endDate").toString();
                    }
                    document.add(new Paragraph("PerÃ­odo: " + period).setFontSize(10).setMarginBottom(2));
                }
                if (filters.containsKey("supervisor")) {
                    document.add(new Paragraph("Supervisor: " + filters.get("supervisor")).setFontSize(10).setMarginBottom(2));
                }
                if (filters.containsKey("vehiclePlate")) {
                    document.add(new Paragraph("Placa: " + filters.get("vehiclePlate")).setFontSize(10).setMarginBottom(2));
                }
                document.add(new Paragraph("").setMarginBottom(10));
            }
            
            // EstatÃ­sticas
            Paragraph stats = new Paragraph(String.format("Total de registros: %d", kmControls.size()))
                    .setFontSize(12)
                    .setBold()
                    .setMarginBottom(15);
            document.add(stats);
            
            // Tabela de registros
            if (kmControls.isEmpty()) {
                Paragraph noData = new Paragraph("Nenhum registro encontrado com os filtros aplicados.")
                        .setTextAlignment(TextAlignment.CENTER)
                        .setFontSize(12)
                        .setMarginTop(20);
                document.add(noData);
            } else {
                Table table = new Table(7).setWidth(UnitValue.createPercentValue(100));
                
                // CabeÃ§alhos
                table.addHeaderCell(createHeaderCell("Data"));
                table.addHeaderCell(createHeaderCell("Supervisor"));
                table.addHeaderCell(createHeaderCell("Placa"));
                table.addHeaderCell(createHeaderCell("KM Inicial"));
                table.addHeaderCell(createHeaderCell("KM Final"));
                table.addHeaderCell(createHeaderCell("Total KM"));
                table.addHeaderCell(createHeaderCell("Valor"));
                
                // Dados
                DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                for (KmControl kmControl : kmControls) {
                    table.addCell(createCell(kmControl.getDate() != null ? 
                            kmControl.getDate().format(dateFormatter) : ""));
                    table.addCell(createCell(kmControl.getSupervisor() != null ? kmControl.getSupervisor() : ""));
                    table.addCell(createCell(kmControl.getVehiclePlate() != null ? kmControl.getVehiclePlate() : ""));
                    table.addCell(createCell(kmControl.getInitialKm() != null ? 
                            String.valueOf(kmControl.getInitialKm()) : ""));
                    table.addCell(createCell(kmControl.getFinalKm() != null ? 
                            String.valueOf(kmControl.getFinalKm()) : ""));
                    table.addCell(createCell(kmControl.getTotalKm() != null ? 
                            String.valueOf(kmControl.getTotalKm()) : ""));
                    table.addCell(createCell(kmControl.getValue() != null ? 
                            "R$ " + kmControl.getValue().setScale(2, java.math.RoundingMode.HALF_UP).toString().replace(".", ",") : ""));
                }
                
                document.add(table);
            }
            
            // Finalizar layout padrÃ£o (adiciona header/footer em todas as pÃ¡ginas)
            standardReportLayoutService.finalizeDocumentLayout(docWithPdf);
            
            document.close();
            
        } catch (Exception e) {
            log.error("Erro ao gerar PDF de Controle de KM: {}", e.getMessage(), e);
            throw new IOException("Erro ao gerar relatÃ³rio PDF: " + e.getMessage(), e);
        }
        
        byte[] result = baos.toByteArray();
        log.info("PDF de Controle de KM gerado com sucesso, tamanho: {} bytes", result.length);
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

    // MÃ©todos auxiliares para criar parÃ¢metros dos relatÃ³rios
    private Map<String, Object> createEmployeeReportParameters(Map<String, Object> filters) {
        Map<String, Object> parameters = jasperReportsConfig.createDefaultParameters();
        parameters.put("REPORT_TITLE", "RelatÃ³rio de FuncionÃ¡rios");
        parameters.put("REPORT_SUBTITLE", "Lista completa de funcionÃ¡rios do sistema");
        parameters.put("GENERATED_BY", "Sistema Secure Guard");
        parameters.put("FILTERS", filters);
        parameters.put("TOTAL_EMPLOYEES", employeeService.findAll().size());
        return parameters;
    }

    private Map<String, Object> createCompanyReportParameters(Map<String, Object> filters) {
        Map<String, Object> parameters = jasperReportsConfig.createDefaultParameters();
        parameters.put("REPORT_TITLE", "RelatÃ³rio de Empresas");
        parameters.put("REPORT_SUBTITLE", "Lista completa de empresas cadastradas");
        parameters.put("GENERATED_BY", "Sistema Secure Guard");
        parameters.put("FILTERS", filters);
        parameters.put("TOTAL_COMPANIES", companyService.getAllCompanies().size());
        return parameters;
    }

    private Map<String, Object> createProductReportParameters(Map<String, Object> filters) {
        Map<String, Object> parameters = jasperReportsConfig.createDefaultParameters();
        parameters.put("REPORT_TITLE", "RelatÃ³rio de Produtos");
        parameters.put("REPORT_SUBTITLE", "CatÃ¡logo completo de produtos");
        parameters.put("GENERATED_BY", "Sistema Secure Guard");
        parameters.put("FILTERS", filters);
        parameters.put("TOTAL_PRODUCTS", productService.getAllProducts().size());
        return parameters;
    }

    private Map<String, Object> createInventoryReportParameters(Map<String, Object> filters) {
        Map<String, Object> parameters = jasperReportsConfig.createDefaultParameters();
        parameters.put("REPORT_TITLE", "RelatÃ³rio de Estoque");
        parameters.put("REPORT_SUBTITLE", "SituaÃ§Ã£o atual do estoque");
        parameters.put("GENERATED_BY", "Sistema Secure Guard");
        parameters.put("FILTERS", filters);
        parameters.put("TOTAL_ITEMS", inventoryItemService.findAll().size());
        return parameters;
    }

    private Map<String, Object> createFinancialReportParameters(Map<String, Object> filters) {
        Map<String, Object> parameters = jasperReportsConfig.createDefaultParameters();
        parameters.put("FILTERS", filters);
        parameters.put("TOTAL_TRANSACTIONS", financialTransactionService.findAll().size());
        return parameters;
    }

    private Map<String, Object> createConsolidatedReportParameters(Map<String, Object> filters) {
        Map<String, Object> parameters = jasperReportsConfig.createDefaultParameters();
        parameters.put("REPORT_TITLE", "RelatÃ³rio Consolidado");
        parameters.put("REPORT_SUBTITLE", "VisÃ£o geral do sistema");
        parameters.put("GENERATED_BY", "Sistema Secure Guard");
        parameters.put("FILTERS", filters);
        parameters.put("REPORT_DATE", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        return parameters;
    }

    private Map<String, Object> createKmControlReportParameters(Map<String, Object> filters) {
        Map<String, Object> parameters = jasperReportsConfig.createDefaultParameters();
        parameters.put("REPORT_TITLE", "RelatÃ³rio de Controle de Quilometragem");
        parameters.put("REPORT_SUBTITLE", "Registros de Quilometragem da Frota");
        parameters.put("GENERATED_BY", "Sistema Secure Guard");
        parameters.put("FILTERS", filters);
        // Adicionar parÃ¢metros de filtro especÃ­ficos, se houver
        if (filters.containsKey("startDate")) {
            parameters.put("FILTER_START_DATE", filters.get("startDate"));
        }
        if (filters.containsKey("endDate")) {
            parameters.put("FILTER_END_DATE", filters.get("endDate"));
        }
        if (filters.containsKey("supervisor")) {
            parameters.put("FILTER_SUPERVISOR", filters.get("supervisor"));
        }
        if (filters.containsKey("vehiclePlate")) {
            parameters.put("FILTER_VEHICLE_PLATE", filters.get("vehiclePlate"));
        }
        parameters.put("REPORT_DATE", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        return parameters;
    }
} 
