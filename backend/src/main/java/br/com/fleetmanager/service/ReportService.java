package br.com.fleetmanager.service;

import br.com.fleetmanager.config.JasperReportsConfig;
import br.com.fleetmanager.dto.EmployeeDTO;
import br.com.fleetmanager.dto.CompanyDTO;
import br.com.fleetmanager.dto.ProductDTO;
import br.com.fleetmanager.dto.InventoryItemDTO;
import br.com.fleetmanager.dto.FinancialTransactionDTO;
import br.com.fleetmanager.model.Employee;
import br.com.fleetmanager.model.InventoryItem;
import br.com.fleetmanager.model.FinancialTransaction;
import br.com.fleetmanager.exception.ReportGenerationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import net.sf.jasperreports.engine.export.ooxml.JRXlsxExporter;
import net.sf.jasperreports.export.SimpleExporterInput;
import net.sf.jasperreports.export.SimpleOutputStreamExporterOutput;
import net.sf.jasperreports.export.SimpleXlsxReportConfiguration;
import org.springframework.stereotype.Service;
import org.springframework.util.ResourceUtils;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import br.com.fleetmanager.model.KmControl;
import br.com.fleetmanager.repository.KmControlRepository; // Importar KmControlRepository

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
    private final KmControlRepository kmControlRepository; // Injetar KmControlRepository

    /**
     * Gera relatório de funcionários em PDF
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
            log.error("Erro ao gerar relatório de funcionários em PDF", e);
            throw new ReportGenerationException("Erro ao gerar relatório de funcionários", e);
        }
    }

    /**
     * Gera relatório de funcionários em Excel
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
            log.error("Erro ao gerar relatório de funcionários em Excel", e);
            throw new ReportGenerationException("Erro ao gerar relatório de funcionários", e);
        }
    }

    /**
     * Gera relatório de empresas em PDF
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
            log.error("Erro ao gerar relatório de empresas em PDF", e);
            throw new ReportGenerationException("Erro ao gerar relatório de empresas", e);
        }
    }

    /**
     * Gera relatório de produtos em PDF
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
            log.error("Erro ao gerar relatório de produtos em PDF", e);
            throw new ReportGenerationException("Erro ao gerar relatório de produtos", e);
        }
    }

    /**
     * Gera relatório de estoque em PDF
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
            log.error("Erro ao gerar relatório de estoque em PDF", e);
            throw new ReportGenerationException("Erro ao gerar relatório de estoque", e);
        }
    }

    /**
     * Gera relatório financeiro em PDF
     */
    public byte[] generateFinancialReportPdf(Map<String, Object> filters) {
        try {
            List<FinancialTransaction> transactions = financialTransactionService.findAll();
            Map<String, Object> parameters = createFinancialReportParameters(filters);
            
            return jasperReportsConfig.generatePdfReport(
                "reports/financial_report.jrxml", 
                transactions, 
                parameters
            );
        } catch (JRException | IOException e) {
            log.error("Erro ao gerar relatório financeiro em PDF", e);
            throw new ReportGenerationException("Erro ao gerar relatório financeiro", e);
        }
    }

    /**
     * Gera relatório consolidado em PDF
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
            log.error("Erro ao gerar relatório consolidado em PDF", e);
            throw new ReportGenerationException("Erro ao gerar relatório consolidado", e);
        }
    }

    /**
     * Gera relatório de Controle de Quilometragem em PDF ou Excel
     */
    public byte[] generateKmControlReport(List<KmControl> kmControls, Map<String, Object> filters, String format) throws JRException, IOException {
        Map<String, Object> parameters = createKmControlReportParameters(filters);
        
        if ("pdf".equalsIgnoreCase(format)) {
            return jasperReportsConfig.generatePdfReport("reports/km_control_report.jrxml", kmControls, parameters);
        } else if ("xlsx".equalsIgnoreCase(format)) {
            return jasperReportsConfig.generateExcelReport("reports/km_control_report.jrxml", kmControls, parameters);
        } else {
            throw new IllegalArgumentException("Formato de relatório inválido: " + format);
        }
    }

    // Métodos auxiliares para criar parâmetros dos relatórios
    private Map<String, Object> createEmployeeReportParameters(Map<String, Object> filters) {
        Map<String, Object> parameters = jasperReportsConfig.createDefaultParameters();
        parameters.put("REPORT_TITLE", "Relatório de Funcionários");
        parameters.put("REPORT_SUBTITLE", "Lista completa de funcionários do sistema");
        parameters.put("GENERATED_BY", "Sistema Secure Guard");
        parameters.put("FILTERS", filters);
        parameters.put("TOTAL_EMPLOYEES", employeeService.findAll().size());
        return parameters;
    }

    private Map<String, Object> createCompanyReportParameters(Map<String, Object> filters) {
        Map<String, Object> parameters = jasperReportsConfig.createDefaultParameters();
        parameters.put("REPORT_TITLE", "Relatório de Empresas");
        parameters.put("REPORT_SUBTITLE", "Lista completa de empresas cadastradas");
        parameters.put("GENERATED_BY", "Sistema Secure Guard");
        parameters.put("FILTERS", filters);
        parameters.put("TOTAL_COMPANIES", companyService.getAllCompanies().size());
        return parameters;
    }

    private Map<String, Object> createProductReportParameters(Map<String, Object> filters) {
        Map<String, Object> parameters = jasperReportsConfig.createDefaultParameters();
        parameters.put("REPORT_TITLE", "Relatório de Produtos");
        parameters.put("REPORT_SUBTITLE", "Catálogo completo de produtos");
        parameters.put("GENERATED_BY", "Sistema Secure Guard");
        parameters.put("FILTERS", filters);
        parameters.put("TOTAL_PRODUCTS", productService.getAllProducts().size());
        return parameters;
    }

    private Map<String, Object> createInventoryReportParameters(Map<String, Object> filters) {
        Map<String, Object> parameters = jasperReportsConfig.createDefaultParameters();
        parameters.put("REPORT_TITLE", "Relatório de Estoque");
        parameters.put("REPORT_SUBTITLE", "Situação atual do estoque");
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
        parameters.put("REPORT_TITLE", "Relatório Consolidado");
        parameters.put("REPORT_SUBTITLE", "Visão geral do sistema");
        parameters.put("GENERATED_BY", "Sistema Secure Guard");
        parameters.put("FILTERS", filters);
        parameters.put("REPORT_DATE", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        return parameters;
    }

    private Map<String, Object> createKmControlReportParameters(Map<String, Object> filters) {
        Map<String, Object> parameters = jasperReportsConfig.createDefaultParameters();
        parameters.put("REPORT_TITLE", "Relatório de Controle de Quilometragem");
        parameters.put("REPORT_SUBTITLE", "Registros de Quilometragem da Frota");
        parameters.put("GENERATED_BY", "Sistema Secure Guard");
        parameters.put("FILTERS", filters);
        // Adicionar parâmetros de filtro específicos, se houver
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