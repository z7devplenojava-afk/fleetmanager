package br.com.fleetmanager.config;

import lombok.extern.slf4j.Slf4j;
import net.sf.jasperreports.engine.DefaultJasperReportsContext;
import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import net.sf.jasperreports.engine.export.JRPdfExporter;
import net.sf.jasperreports.engine.export.ooxml.JRXlsxExporter;
import net.sf.jasperreports.export.SimpleExporterInput;
import net.sf.jasperreports.export.SimpleOutputStreamExporterOutput;
import net.sf.jasperreports.export.SimplePdfExporterConfiguration;
import net.sf.jasperreports.export.SimpleXlsxReportConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Configuration
@Slf4j
public class JasperReportsConfig {

    @Bean
    public JasperCompileManager jasperCompileManager() {
        return JasperCompileManager.getInstance(DefaultJasperReportsContext.getInstance());
    }

    @Bean
    public JasperFillManager jasperFillManager() {
        return JasperFillManager.getInstance(DefaultJasperReportsContext.getInstance());
    }

    /**
     * Compila um arquivo JRXML
     */
    public JasperReport compileReport(String jrxmlPath) throws JRException, IOException {
        try (InputStream inputStream = new ClassPathResource(jrxmlPath).getInputStream()) {
            return JasperCompileManager.compileReport(inputStream);
        }
    }

    /**
     * Gera um relatório PDF
     */
    public byte[] generatePdfReport(String jrxmlPath, List<?> data, Map<String, Object> parameters) 
            throws JRException, IOException {
        
        JasperReport jasperReport = compileReport(jrxmlPath);
        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(data);
        
        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        JRPdfExporter exporter = new JRPdfExporter();
        
        exporter.setExporterInput(new SimpleExporterInput(jasperPrint));
        exporter.setExporterOutput(new SimpleOutputStreamExporterOutput(outputStream));
        
        SimplePdfExporterConfiguration configuration = new SimplePdfExporterConfiguration();
        configuration.setMetadataAuthor("Secure Guard System");
        configuration.setMetadataTitle("Relatório Gerado pelo Sistema");
        configuration.setMetadataSubject("Relatório de Gestão");
        configuration.setMetadataCreator("Secure Guard");
        configuration.setMetadataKeywords("relatório, gestão, vigilância");
        
        exporter.setConfiguration(configuration);
        exporter.exportReport();
        
        return outputStream.toByteArray();
    }

    /**
     * Gera um relatório Excel
     */
    public byte[] generateExcelReport(String jrxmlPath, List<?> data, Map<String, Object> parameters) 
            throws JRException, IOException {
        
        JasperReport jasperReport = compileReport(jrxmlPath);
        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(data);
        
        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        JRXlsxExporter exporter = new JRXlsxExporter();
        
        exporter.setExporterInput(new SimpleExporterInput(jasperPrint));
        exporter.setExporterOutput(new SimpleOutputStreamExporterOutput(outputStream));
        
        SimpleXlsxReportConfiguration configuration = new SimpleXlsxReportConfiguration();
        configuration.setOnePagePerSheet(true);
        configuration.setRemoveEmptySpaceBetweenRows(true);
        configuration.setRemoveEmptySpaceBetweenColumns(true);
        configuration.setWhitePageBackground(false);
        configuration.setDetectCellType(true);
        
        exporter.setConfiguration(configuration);
        exporter.exportReport();
        
        return outputStream.toByteArray();
    }

    /**
     * Cria parâmetros padrão para relatórios
     */
    public Map<String, Object> createDefaultParameters() {
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("REPORT_TITLE", "Relatório do Sistema Secure Guard");
        parameters.put("GENERATED_DATE", java.time.LocalDateTime.now());
        parameters.put("COMPANY_NAME", "Secure Guard Ltda");
        parameters.put("COMPANY_ADDRESS", "Rua das Empresas, 123 - Centro");
        parameters.put("COMPANY_PHONE", "(31) 3333-4444");
        parameters.put("COMPANY_EMAIL", "contato@secureguard.com.br");
        return parameters;
    }
} 