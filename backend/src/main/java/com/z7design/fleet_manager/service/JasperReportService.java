package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.AccountsReceivableReportDTO;
import com.z7design.fleet_manager.dto.FuelRecordReportDTO;
import com.z7design.fleet_manager.dto.VehicleReportDTO;
import com.z7design.fleet_manager.dto.BankReconciliationReportDTO;
import com.z7design.fleet_manager.dto.BankFileDTO;
import com.z7design.fleet_manager.dto.FineReportDTO;
import com.z7design.fleet_manager.dto.ScheduledPaymentReportDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class JasperReportService {
    
    public byte[] generateFuelReportPDF(List<FuelRecordReportDTO> records, 
                                       LocalDate startDate, 
                                       LocalDate endDate, 
                                       String vehicleFilter, 
                                       String driverFilter) throws IOException {
        try {
            log.info("Gerando relatÃ³rio PDF com JasperReports - {} registros", records.size());
            
            // Carregar template JRXML
            ClassPathResource resource = new ClassPathResource("reports/fuel-report.jrxml");
            InputStream templateStream = resource.getInputStream();
            
            // Compilar template
            JasperReport jasperReport = JasperCompileManager.compileReport(templateStream);
            log.debug("Template JRXML compilado com sucesso");
            
            // Preparar parÃ¢metros
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("PERIOD", formatPeriod(startDate, endDate));
            parameters.put("GENERATION_DATE", LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            parameters.put("TOTAL_RECORDS", records.size());
            
            // Calcular valor total
            BigDecimal totalCost = records.stream()
                    .map(FuelRecordReportDTO::getCost)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            parameters.put("TOTAL_COST", totalCost);
            
            parameters.put("VEHICLE_FILTER", vehicleFilter != null ? vehicleFilter : "Todos os veÃ­culos");
            parameters.put("DRIVER_FILTER", driverFilter != null ? driverFilter : "Todos os motoristas");
            
            log.debug("ParÃ¢metros preparados: {}", parameters);
            
            // Preparar dados
            JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(records);
            
            // Gerar relatÃ³rio
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);
            log.debug("RelatÃ³rio preenchido com sucesso");
            
            // Exportar para PDF
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            JasperExportManager.exportReportToPdfStream(jasperPrint, outputStream);
            
            byte[] result = outputStream.toByteArray();
            log.info("RelatÃ³rio PDF gerado com sucesso usando JasperReports. {} registros processados, {} bytes gerados", 
                    records.size(), result.length);
            
            return result;
            
        } catch (JRException e) {
            log.error("Erro ao gerar relatÃ³rio com JasperReports", e);
            throw new IOException("Erro ao gerar relatÃ³rio PDF: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Erro inesperado ao gerar relatÃ³rio", e);
            throw new IOException("Erro inesperado ao gerar relatÃ³rio PDF: " + e.getMessage(), e);
        }
    }
    
    public byte[] generateVehicleReportPDF(List<VehicleReportDTO> vehicles, String statusFilter) throws IOException {
        try {
            log.info("Gerando relatÃ³rio PDF de veÃ­culos com JasperReports - {} veÃ­culos", vehicles.size());
            
            // Carregar template JRXML
            ClassPathResource resource = new ClassPathResource("reports/vehicle-report.jrxml");
            if (!resource.exists()) {
                log.error("Template JRXML nÃ£o encontrado: reports/vehicle-report.jrxml");
                throw new IOException("Template de relatÃ³rio nÃ£o encontrado: reports/vehicle-report.jrxml");
            }
            log.debug("Template JRXML encontrado: {}", resource.getPath());
            
            InputStream templateStream = resource.getInputStream();
            log.debug("Stream do template aberto com sucesso");
            
            // Compilar template
            JasperReport jasperReport = JasperCompileManager.compileReport(templateStream);
            log.debug("Template JRXML de veÃ­culos compilado com sucesso");
            
            // Preparar parÃ¢metros
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("GENERATION_DATE", LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            parameters.put("TOTAL_VEHICLES", vehicles.size());
            
            // Calcular estatÃ­sticas por status
            long activeVehicles = vehicles.stream().filter(v -> "ACTIVE".equals(v.getStatus())).count();
            long maintenanceVehicles = vehicles.stream().filter(v -> "MAINTENANCE".equals(v.getStatus())).count();
            long inactiveVehicles = vehicles.stream().filter(v -> "INACTIVE".equals(v.getStatus())).count();
            
            parameters.put("ACTIVE_VEHICLES", (int) activeVehicles);
            parameters.put("MAINTENANCE_VEHICLES", (int) maintenanceVehicles);
            parameters.put("INACTIVE_VEHICLES", (int) inactiveVehicles);
            
            // Definir filtro aplicado
            if (statusFilter != null && !statusFilter.isEmpty()) {
                switch (statusFilter.toUpperCase()) {
                    case "ACTIVE":
                        parameters.put("FILTER_STATUS", "Apenas veÃ­culos ativos");
                        break;
                    case "MAINTENANCE":
                        parameters.put("FILTER_STATUS", "Apenas veÃ­culos em manutenÃ§Ã£o");
                        break;
                    case "INACTIVE":
                        parameters.put("FILTER_STATUS", "Apenas veÃ­culos inativos");
                        break;
                    default:
                        parameters.put("FILTER_STATUS", "Todos os veÃ­culos");
                }
            } else {
                parameters.put("FILTER_STATUS", "Todos os veÃ­culos");
            }
            
            log.debug("ParÃ¢metros preparados: {}", parameters);
            
            // Preparar dados
            JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(vehicles);
            
            // Gerar relatÃ³rio
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);
            log.debug("RelatÃ³rio de veÃ­culos preenchido com sucesso");
            
            // Exportar para PDF
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            JasperExportManager.exportReportToPdfStream(jasperPrint, outputStream);
            
            byte[] result = outputStream.toByteArray();
            log.info("RelatÃ³rio PDF de veÃ­culos gerado com sucesso usando JasperReports. {} veÃ­culos processados, {} bytes gerados", 
                    vehicles.size(), result.length);
            
            return result;
            
        } catch (JRException e) {
            log.error("Erro ao gerar relatÃ³rio de veÃ­culos com JasperReports", e);
            throw new IOException("Erro ao gerar relatÃ³rio PDF de veÃ­culos: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Erro inesperado ao gerar relatÃ³rio de veÃ­culos", e);
            throw new IOException("Erro inesperado ao gerar relatÃ³rio PDF de veÃ­culos: " + e.getMessage(), e);
        }
    }
    
    private String formatPeriod(LocalDate startDate, LocalDate endDate) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        
        if (startDate != null && endDate != null) {
            return startDate.format(formatter) + " a " + endDate.format(formatter);
        } else if (startDate != null) {
            return "A partir de " + startDate.format(formatter);
        } else if (endDate != null) {
            return "AtÃ© " + endDate.format(formatter);
        } else {
            return "Todos os perÃ­odos";
        }
    }
    
    // ===== BANK RECONCILIATION REPORTS =====
    
    public byte[] generateBankReconciliationReportPDF(List<BankReconciliationReportDTO> transactions, 
                                                      BankFileDTO file, 
                                                      String statusFilter) throws IOException {
        try {
            log.info("Gerando relatÃ³rio PDF de conciliaÃ§Ã£o bancÃ¡ria com JasperReports - {} transaÃ§Ãµes", transactions.size());
            
            // Carregar template JRXML
            ClassPathResource resource = new ClassPathResource("reports/bank-reconciliation-report.jrxml");
            InputStream templateStream = resource.getInputStream();
            
            // Compilar template
            JasperReport jasperReport = JasperCompileManager.compileReport(templateStream);
            log.debug("Template JRXML de conciliaÃ§Ã£o bancÃ¡ria compilado com sucesso");
            
            // Preparar parÃ¢metros
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("GENERATION_DATE", LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            parameters.put("TOTAL_TRANSACTIONS", transactions.size());
            
            // InformaÃ§Ãµes do arquivo
            if (file != null) {
                parameters.put("FILE_NAME", file.getFileName());
                parameters.put("BANK_NAME", file.getBankName());
                parameters.put("ACCOUNT_NUMBER", file.getAccountNumber());
                parameters.put("PERIOD", file.getPeriod());
            } else {
                parameters.put("FILE_NAME", "Todos os arquivos");
                parameters.put("BANK_NAME", "Todos os bancos");
                parameters.put("ACCOUNT_NUMBER", "Todas as contas");
                parameters.put("PERIOD", "Todos os perÃ­odos");
            }
            
            // Calcular estatÃ­sticas
            long matchedTransactions = transactions.stream()
                    .filter(t -> "MATCHED".equals(t.getStatus()))
                    .count();
            long unmatchedTransactions = transactions.stream()
                    .filter(t -> "UNMATCHED".equals(t.getStatus()))
                    .count();
            long pendingTransactions = transactions.stream()
                    .filter(t -> "PENDING".equals(t.getStatus()))
                    .count();
            
            parameters.put("MATCHED_TRANSACTIONS", (int) matchedTransactions);
            parameters.put("UNMATCHED_TRANSACTIONS", (int) unmatchedTransactions);
            parameters.put("PENDING_TRANSACTIONS", (int) pendingTransactions);
            
            // Definir filtro aplicado
            if (statusFilter != null && !statusFilter.isEmpty() && !statusFilter.equals("ALL")) {
                switch (statusFilter.toUpperCase()) {
                    case "MATCHED":
                        parameters.put("FILTER_STATUS", "Apenas transaÃ§Ãµes conciliadas");
                        break;
                    case "UNMATCHED":
                        parameters.put("FILTER_STATUS", "Apenas transaÃ§Ãµes nÃ£o conciliadas");
                        break;
                    case "PENDING":
                        parameters.put("FILTER_STATUS", "Apenas transaÃ§Ãµes pendentes");
                        break;
                    default:
                        parameters.put("FILTER_STATUS", "Todas as transaÃ§Ãµes");
                }
            } else {
                parameters.put("FILTER_STATUS", "Todas as transaÃ§Ãµes");
            }
            
            log.debug("ParÃ¢metros preparados: {}", parameters);
            
            // Preparar dados
            JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(transactions);
            
            // Gerar relatÃ³rio
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);
            log.debug("RelatÃ³rio de conciliaÃ§Ã£o bancÃ¡ria preenchido com sucesso");
            
            // Exportar para PDF
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            JasperExportManager.exportReportToPdfStream(jasperPrint, outputStream);
            
            byte[] result = outputStream.toByteArray();
            log.info("RelatÃ³rio PDF de conciliaÃ§Ã£o bancÃ¡ria gerado com sucesso usando JasperReports. {} transaÃ§Ãµes processadas, {} bytes gerados", 
                    transactions.size(), result.length);
            
            return result;
            
        } catch (JRException e) {
            log.error("Erro ao gerar relatÃ³rio de conciliaÃ§Ã£o bancÃ¡ria com JasperReports", e);
            throw new IOException("Erro ao gerar relatÃ³rio PDF de conciliaÃ§Ã£o bancÃ¡ria: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Erro inesperado ao gerar relatÃ³rio de conciliaÃ§Ã£o bancÃ¡ria", e);
            throw new IOException("Erro inesperado ao gerar relatÃ³rio PDF de conciliaÃ§Ã£o bancÃ¡ria: " + e.getMessage(), e);
        }
    }
    
    public byte[] generateBankReconciliationSummaryReportPDF(List<BankReconciliationReportDTO> transactions, 
                                                             LocalDate startDate, 
                                                             LocalDate endDate, 
                                                             String bankName) throws IOException {
        try {
            log.info("Gerando relatÃ³rio PDF de resumo de conciliaÃ§Ã£o bancÃ¡ria com JasperReports - {} transaÃ§Ãµes", transactions.size());
            
            // Carregar template JRXML
            ClassPathResource resource = new ClassPathResource("reports/bank-reconciliation-summary-report.jrxml");
            InputStream templateStream = resource.getInputStream();
            
            // Compilar template
            JasperReport jasperReport = JasperCompileManager.compileReport(templateStream);
            log.debug("Template JRXML de resumo de conciliaÃ§Ã£o bancÃ¡ria compilado com sucesso");
            
            // Preparar parÃ¢metros
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("GENERATION_DATE", LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            parameters.put("PERIOD", formatPeriod(startDate, endDate));
            parameters.put("BANK_FILTER", bankName != null ? bankName : "Todos os bancos");
            parameters.put("TOTAL_TRANSACTIONS", transactions.size());
            
            // Calcular estatÃ­sticas por banco
            Map<String, Long> bankStats = transactions.stream()
                    .collect(java.util.stream.Collectors.groupingBy(
                            BankReconciliationReportDTO::getBankName,
                            java.util.stream.Collectors.counting()));
            
            parameters.put("BANK_STATS", bankStats);
            
            // Calcular estatÃ­sticas por status
            long matchedTransactions = transactions.stream()
                    .filter(t -> "MATCHED".equals(t.getStatus()))
                    .count();
            long unmatchedTransactions = transactions.stream()
                    .filter(t -> "UNMATCHED".equals(t.getStatus()))
                    .count();
            long pendingTransactions = transactions.stream()
                    .filter(t -> "PENDING".equals(t.getStatus()))
                    .count();
            
            parameters.put("MATCHED_TRANSACTIONS", (int) matchedTransactions);
            parameters.put("UNMATCHED_TRANSACTIONS", (int) unmatchedTransactions);
            parameters.put("PENDING_TRANSACTIONS", (int) pendingTransactions);
            
            log.debug("ParÃ¢metros preparados: {}", parameters);
            
            // Preparar dados
            JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(transactions);
            
            // Gerar relatÃ³rio
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);
            log.debug("RelatÃ³rio de resumo de conciliaÃ§Ã£o bancÃ¡ria preenchido com sucesso");
            
            // Exportar para PDF
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            JasperExportManager.exportReportToPdfStream(jasperPrint, outputStream);
            
            byte[] result = outputStream.toByteArray();
            log.info("RelatÃ³rio PDF de resumo de conciliaÃ§Ã£o bancÃ¡ria gerado com sucesso usando JasperReports. {} transaÃ§Ãµes processadas, {} bytes gerados", 
                    transactions.size(), result.length);
            
            return result;
            
        } catch (JRException e) {
            log.error("Erro ao gerar relatÃ³rio de resumo de conciliaÃ§Ã£o bancÃ¡ria com JasperReports", e);
            throw new IOException("Erro ao gerar relatÃ³rio PDF de resumo de conciliaÃ§Ã£o bancÃ¡ria: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Erro inesperado ao gerar relatÃ³rio de resumo de conciliaÃ§Ã£o bancÃ¡ria", e);
            throw new IOException("Erro inesperado ao gerar relatÃ³rio PDF de resumo de conciliaÃ§Ã£o bancÃ¡ria: " + e.getMessage(), e);
        }
    }
    
    // ===== FINE REPORTS =====
    
    public byte[] generateFineReportPDF(List<FineReportDTO> fines, 
                                       LocalDate startDate, 
                                       LocalDate endDate, 
                                       String vehicleFilter, 
                                       String driverFilter,
                                       String statusFilter) throws IOException {
        return generateFineReportPDF(fines, startDate, endDate, vehicleFilter, driverFilter, statusFilter);
    }
    
    private byte[] generateFineReportPDFSimple(List<FineReportDTO> fines, String vehicleFilter, String driverFilter, String statusFilter) throws IOException {
        try {
            log.info("Gerando relatÃ³rio PDF simplificado de multas - {} multas", fines.size());
            
            // Carregar template JRXML simplificado
            ClassPathResource resource = new ClassPathResource("reports/fine-report-simple.jrxml");
            InputStream templateStream = resource.getInputStream();
            
            // Compilar template
            JasperReport jasperReport = JasperCompileManager.compileReport(templateStream);
            log.debug("Template JRXML simplificado compilado com sucesso");
            
            // Preparar parÃ¢metros mÃ­nimos
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("GENERATION_DATE", LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            parameters.put("TOTAL_FINES", fines.size());
            
            // Calcular valor total
            BigDecimal totalAmount = fines.stream()
                    .map(FineReportDTO::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            parameters.put("TOTAL_AMOUNT", totalAmount);
            
            // Calcular estatÃ­sticas por status
            long pendingFines = fines.stream()
                    .filter(f -> "PENDING".equals(f.getStatus()))
                    .count();
            long paidFines = fines.stream()
                    .filter(f -> "PAID".equals(f.getStatus()))
                    .count();
            long overdueFines = fines.stream()
                    .filter(f -> f.isOverdue())
                    .count();
            
            parameters.put("PENDING_FINES", (int) pendingFines);
            parameters.put("PAID_FINES", (int) paidFines);
            parameters.put("OVERDUE_FINES", (int) overdueFines);
            
            // Definir filtros aplicados
            parameters.put("VEHICLE_FILTER", vehicleFilter != null ? vehicleFilter : "Todos os veÃ­culos");
            parameters.put("DRIVER_FILTER", driverFilter != null ? driverFilter : "Todos os motoristas");
            
            if (statusFilter != null && !statusFilter.isEmpty() && !statusFilter.equals("ALL")) {
                switch (statusFilter.toUpperCase()) {
                    case "PENDING":
                        parameters.put("STATUS_FILTER", "Apenas multas pendentes");
                        break;
                    case "PAID":
                        parameters.put("STATUS_FILTER", "Apenas multas pagas");
                        break;
                    case "CANCELLED":
                        parameters.put("STATUS_FILTER", "Apenas multas canceladas");
                        break;
                    default:
                        parameters.put("STATUS_FILTER", "Todos os status");
                }
            } else {
                parameters.put("STATUS_FILTER", "Todos os status");
            }
            
            log.debug("ParÃ¢metros preparados: {}", parameters);
            
            // Preparar dados
            JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(fines);
            
            // Gerar relatÃ³rio
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);
            log.debug("RelatÃ³rio de multas preenchido com sucesso");
            
            // Exportar para PDF
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            JasperExportManager.exportReportToPdfStream(jasperPrint, outputStream);
            
            byte[] result = outputStream.toByteArray();
            log.info("RelatÃ³rio PDF de multas gerado com sucesso usando JasperReports. {} multas processadas, {} bytes gerados", 
                    fines.size(), result.length);
            
            return result;
            
        } catch (JRException e) {
            log.error("Erro ao gerar relatÃ³rio de multas com JasperReports", e);
            throw new IOException("Erro ao gerar relatÃ³rio PDF de multas: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Erro inesperado ao gerar relatÃ³rio de multas", e);
            throw new IOException("Erro inesperado ao gerar relatÃ³rio PDF de multas: " + e.getMessage(), e);
        }
    }
    
    public byte[] generateFineReportExcel(List<FineReportDTO> fines, 
                                         LocalDate startDate, 
                                         LocalDate endDate, 
                                         String vehicleFilter, 
                                         String driverFilter,
                                         String statusFilter) throws IOException {
        // TODO: Implementar geraÃ§Ã£o de Excel
        throw new UnsupportedOperationException("GeraÃ§Ã£o de Excel temporariamente desabilitada");
    }
    
    /* Temporariamente comentado para resolver erro de compilaÃ§Ã£o
    private byte[] generateFineReportExcelSimple(List<FineReportDTO> fines, String vehicleFilter, String driverFilter, String statusFilter) throws IOException {
        try {
            log.info("Gerando relatÃ³rio Excel de multas com JasperReports - {} multas", fines.size());
            
            // Carregar template JRXML
            ClassPathResource resource = new ClassPathResource("reports/fine-report.jrxml");
            InputStream templateStream = resource.getInputStream();
            
            // Compilar template
            JasperReport jasperReport = JasperCompileManager.compileReport(templateStream);
            log.debug("Template JRXML de multas compilado com sucesso");
            
            // Preparar parÃ¢metros
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("PERIOD", "PerÃ­odo nÃ£o especificado");
            parameters.put("GENERATION_DATE", LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            parameters.put("TOTAL_FINES", fines.size());
            
            // Calcular valor total
            BigDecimal totalAmount = fines.stream()
                    .map(FineReportDTO::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            parameters.put("TOTAL_AMOUNT", totalAmount);
            
            // Calcular estatÃ­sticas por status
            long pendingFines = fines.stream()
                    .filter(f -> "PENDING".equals(f.getStatus()))
                    .count();
            long paidFines = fines.stream()
                    .filter(f -> "PAID".equals(f.getStatus()))
                    .count();
            long overdueFines = fines.stream()
                    .filter(f -> f.isOverdue())
                    .count();
            
            parameters.put("PENDING_FINES", (int) pendingFines);
            parameters.put("PAID_FINES", (int) paidFines);
            parameters.put("OVERDUE_FINES", (int) overdueFines);
            
            // Definir filtros aplicados
            parameters.put("VEHICLE_FILTER", vehicleFilter != null ? vehicleFilter : "Todos os veÃ­culos");
            parameters.put("DRIVER_FILTER", driverFilter != null ? driverFilter : "Todos os motoristas");
            
            if (statusFilter != null && !statusFilter.isEmpty() && !statusFilter.equals("ALL")) {
                switch (statusFilter.toUpperCase()) {
                    case "PENDING":
                        parameters.put("STATUS_FILTER", "Apenas multas pendentes");
                        break;
                    case "PAID":
                        parameters.put("STATUS_FILTER", "Apenas multas pagas");
                        break;
                    case "CANCELLED":
                        parameters.put("STATUS_FILTER", "Apenas multas canceladas");
                        break;
                    default:
                        parameters.put("STATUS_FILTER", "Todos os status");
                }
            } else {
                parameters.put("STATUS_FILTER", "Todos os status");
            }
            
            log.debug("ParÃ¢metros preparados: {}", parameters);
            
            // Preparar dados
            JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(fines);
            
            // Gerar relatÃ³rio
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);
            log.debug("RelatÃ³rio de multas preenchido com sucesso");
            
            // Exportar para Excel
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            JasperExportManager.exportReportToPdfStream(jasperPrint, outputStream);
            
            byte[] result = outputStream.toByteArray();
            log.info("RelatÃ³rio Excel de multas gerado com sucesso usando JasperReports. {} multas processadas, {} bytes gerados", 
                    fines.size(), result.length);
            
            return result;
            
        } catch (JRException e) {
            log.error("Erro ao gerar relatÃ³rio Excel de multas com JasperReports", e);
            throw new IOException("Erro ao gerar relatÃ³rio Excel de multas: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Erro inesperado ao gerar relatÃ³rio Excel de multas", e);
            throw new IOException("Erro inesperado ao gerar relatÃ³rio Excel de multas: " + e.getMessage(), e);
        }
    }*/
    
    // ===== ACCOUNTS RECEIVABLE REPORTS =====
    
    public byte[] generateAccountsReceivableReportPDF(List<AccountsReceivableReportDTO> accounts, 
                                                    LocalDate startDate, 
                                                    LocalDate endDate, 
                                                    String clientFilter, 
                                                    String statusFilter,
                                                    String categoryFilter,
                                                    String paymentMethodFilter,
                                                    BigDecimal amountMin,
                                                    BigDecimal amountMax) throws IOException {
        try {
            log.info("Gerando relatÃ³rio PDF de contas a receber com JasperReports - {} contas", accounts.size());
            
            // Carregar template JRXML
            ClassPathResource resource = new ClassPathResource("reports/accounts-receivable-report.jrxml");
            InputStream templateStream = resource.getInputStream();
            
            // Compilar template
            JasperReport jasperReport = JasperCompileManager.compileReport(templateStream);
            log.debug("Template JRXML de contas a receber compilado com sucesso");
            
            // Preparar parÃ¢metros
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("GENERATION_DATE", LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            parameters.put("PERIOD", formatPeriod(startDate, endDate));
            parameters.put("TOTAL_ACCOUNTS", accounts.size());
            
            // Calcular valor total
            BigDecimal totalAmount = accounts.stream()
                    .map(AccountsReceivableReportDTO::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            parameters.put("TOTAL_AMOUNT", totalAmount);
            
            // Calcular valor pendente
            BigDecimal totalPending = accounts.stream()
                    .map(AccountsReceivableReportDTO::getPendingAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            parameters.put("TOTAL_PENDING", totalPending);
            
            // Definir filtros aplicados
            parameters.put("CLIENT_FILTER", clientFilter != null ? clientFilter : "Todos os clientes");
            parameters.put("STATUS_FILTER", statusFilter != null && !statusFilter.equals("ALL") ? statusFilter : "Todos os status");
            parameters.put("CATEGORY_FILTER", categoryFilter != null && !categoryFilter.equals("ALL") ? categoryFilter : "Todas as categorias");
            parameters.put("PAYMENT_METHOD_FILTER", paymentMethodFilter != null && !paymentMethodFilter.equals("ALL") ? paymentMethodFilter : "Todos os mÃ©todos");
            
            if (amountMin != null || amountMax != null) {
                String amountRange = "";
                if (amountMin != null) amountRange += "A partir de R$ " + amountMin;
                if (amountMin != null && amountMax != null) amountRange += " atÃ© ";
                if (amountMax != null) amountRange += "AtÃ© R$ " + amountMax;
                parameters.put("AMOUNT_FILTER", amountRange);
            } else {
                parameters.put("AMOUNT_FILTER", "Todos os valores");
            }
            
            log.debug("ParÃ¢metros preparados: {}", parameters);
            
            // Preparar dados
            JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(accounts);
            
            // Gerar relatÃ³rio
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);
            log.debug("RelatÃ³rio de contas a receber preenchido com sucesso");
            
            // Exportar para PDF
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            JasperExportManager.exportReportToPdfStream(jasperPrint, outputStream);
            
            byte[] result = outputStream.toByteArray();
            log.info("RelatÃ³rio PDF de contas a receber gerado com sucesso usando JasperReports. {} contas processadas, {} bytes gerados", 
                    accounts.size(), result.length);
            
            return result;
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio PDF de contas a receber: " + e.getMessage(), e);
            throw new IOException("Erro ao gerar relatÃ³rio de contas a receber: " + e.getMessage(), e);
        }
    }
    
    // ===== SCHEDULED PAYMENT REPORTS =====
    
    public byte[] generateScheduledPaymentReportPDF(List<ScheduledPaymentReportDTO> payments, 
                                                  LocalDate startDate, 
                                                  LocalDate endDate, 
                                                  String clientFilter, 
                                                  String statusFilter,
                                                  String paymentMethodFilter,
                                                  BigDecimal amountMin,
                                                  BigDecimal amountMax) throws IOException {
        try {
            log.info("Gerando relatÃ³rio PDF de pagamentos agendados com JasperReports - {} pagamentos", payments.size());
            
            // Carregar template JRXML
            ClassPathResource resource = new ClassPathResource("reports/scheduled-payment-report.jrxml");
            InputStream templateStream = resource.getInputStream();
            
            // Compilar template
            JasperReport jasperReport = JasperCompileManager.compileReport(templateStream);
            log.debug("Template JRXML de pagamentos agendados compilado com sucesso");
            
            // Preparar parÃ¢metros
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("GENERATION_DATE", LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            parameters.put("PERIOD", formatPeriod(startDate, endDate));
            parameters.put("TOTAL_PAYMENTS", payments.size());
            
            // Calcular valor total
            BigDecimal totalAmount = payments.stream()
                    .map(ScheduledPaymentReportDTO::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            parameters.put("TOTAL_AMOUNT", totalAmount);
            
            // Definir filtros aplicados
            parameters.put("CLIENT_FILTER", clientFilter != null ? clientFilter : "Todos os clientes");
            parameters.put("STATUS_FILTER", statusFilter != null && !statusFilter.equals("ALL") ? statusFilter : "Todos os status");
            parameters.put("PAYMENT_METHOD_FILTER", paymentMethodFilter != null && !paymentMethodFilter.equals("ALL") ? paymentMethodFilter : "Todos os mÃ©todos");
            
            if (amountMin != null || amountMax != null) {
                String amountRange = "";
                if (amountMin != null) amountRange += "A partir de R$ " + amountMin;
                if (amountMin != null && amountMax != null) amountRange += " atÃ© ";
                if (amountMax != null) amountRange += "AtÃ© R$ " + amountMax;
                parameters.put("AMOUNT_FILTER", amountRange);
            } else {
                parameters.put("AMOUNT_FILTER", "Todos os valores");
            }
            
            log.debug("ParÃ¢metros preparados: {}", parameters);
            
            // Preparar dados
            JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(payments);
            
            // Gerar relatÃ³rio
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);
            log.debug("RelatÃ³rio de pagamentos agendados preenchido com sucesso");
            
            // Exportar para PDF
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            JasperExportManager.exportReportToPdfStream(jasperPrint, outputStream);
            
            byte[] result = outputStream.toByteArray();
            log.info("RelatÃ³rio PDF de pagamentos agendados gerado com sucesso usando JasperReports. {} pagamentos processados, {} bytes gerados", 
                    payments.size(), result.length);
            
            return result;
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio PDF de pagamentos agendados: " + e.getMessage(), e);
            throw new IOException("Erro ao gerar relatÃ³rio de pagamentos agendados: " + e.getMessage(), e);
        }
    }
}

