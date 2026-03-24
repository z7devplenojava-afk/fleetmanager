package com.z7design.fleet_manager.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class EquipmentReportService {
    
    public List<Map<String, Object>> generateEquipmentByEmployeeReport(
            LocalDate startDate, LocalDate endDate, String status, String equipmentType) {
        
        log.info("Gerando relatÃ³rio de equipamentos por funcionÃ¡rio");
        
        List<Map<String, Object>> report = new ArrayList<>();
        
        try {
            // Por enquanto, usar dados de exemplo realistas baseados no banco
            // TODO: Implementar queries especÃ­ficas quando necessÃ¡rio
            
            report.add(Map.of(
                "employeeId", "emp-001",
                "employeeName", "GIDELVAN SILVA",
                "totalEquipment", 5,
                "activeEquipment", 4,
                "inactiveEquipment", 1,
                "equipmentDetails", List.of(
                    Map.of(
                        "equipmentId", "eq-001",
                        "equipmentName", "Pistola Glock 17",
                        "serialNumber", "GL001234",
                        "status", "ATIVO",
                        "assignedDate", "2025-01-15",
                        "lastMovement", "2025-01-20"
                    ),
                    Map.of(
                        "equipmentId", "eq-002", 
                        "equipmentName", "Uniforme Completo",
                        "serialNumber", "UN001234",
                        "status", "ATIVO",
                        "assignedDate", "2025-01-10",
                        "lastMovement", "2025-01-18"
                    )
                )
            ));
            
            report.add(Map.of(
                "employeeId", "emp-002",
                "employeeName", "ALEX SANTOS",
                "totalEquipment", 3,
                "activeEquipment", 3,
                "inactiveEquipment", 0,
                "equipmentDetails", List.of(
                    Map.of(
                        "equipmentId", "eq-003",
                        "equipmentName", "RÃ¡dio Motorola",
                        "serialNumber", "RD001234",
                        "status", "ATIVO",
                        "assignedDate", "2025-01-12",
                        "lastMovement", "2025-01-19"
                    )
                )
            ));
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio de equipamentos por funcionÃ¡rio", e);
        }
        
        return report;
    }

    public List<Map<String, Object>> generateWeaponValidityReport(LocalDate startDate, LocalDate endDate) {
        log.info("Gerando relatÃ³rio de validade de armas");
        
        List<Map<String, Object>> report = new ArrayList<>();
        
        report.add(Map.of(
            "weaponId", "wp-001",
            "weaponName", "Pistola Glock 17",
            "serialNumber", "GL001234",
            "registrationNumber", "REG001234",
            "validityDate", "2025-12-31",
            "daysToExpire", 73,
            "status", "VÃLIDA",
            "owner", "GIDELVAN SILVA",
            "lastInspection", "2025-01-15"
        ));
        
        report.add(Map.of(
            "weaponId", "wp-002",
            "weaponName", "Pistola Taurus PT92",
            "serialNumber", "TA001234",
            "registrationNumber", "REG001235",
            "validityDate", "2025-03-15",
            "daysToExpire", 16,
            "status", "VENCENDO",
            "owner", "ALEX SANTOS",
            "lastInspection", "2025-01-10"
        ));
        
        return report;
    }

    public List<Map<String, Object>> generateUsageReport(LocalDate startDate, LocalDate endDate) {
        log.info("Gerando relatÃ³rio de uso de equipamentos");
        
        List<Map<String, Object>> report = new ArrayList<>();
        
        report.add(Map.of(
            "equipmentId", "eq-001",
            "equipmentName", "Pistola Glock 17",
            "serialNumber", "GL001234",
            "totalMovements", 15,
            "withdrawals", 8,
            "returns", 7,
            "averageUsageDays", 3.5,
            "lastMovement", "2025-01-20",
            "mostUsedBy", "GIDELVAN SILVA"
        ));
        
        report.add(Map.of(
            "equipmentId", "eq-002",
            "equipmentName", "RÃ¡dio Motorola",
            "serialNumber", "RD001234",
            "totalMovements", 25,
            "withdrawals", 12,
            "returns", 13,
            "averageUsageDays", 2.1,
            "lastMovement", "2025-01-19",
            "mostUsedBy", "ALEX SANTOS"
        ));
        
        return report;
    }

    public List<Map<String, Object>> generateExpirationReport(LocalDate startDate, LocalDate endDate) {
        log.info("Gerando relatÃ³rio de vencimento de equipamentos");
        
        List<Map<String, Object>> report = new ArrayList<>();
        
        report.add(Map.of(
            "equipmentId", "eq-001",
            "equipmentName", "Uniforme Completo",
            "serialNumber", "UN001234",
            "expirationDate", "2025-02-15",
            "daysToExpire", 24,
            "status", "VENCENDO",
            "assignedTo", "GIDELVAN SILVA",
            "lastMaintenance", "2025-01-10"
        ));
        
        report.add(Map.of(
            "equipmentId", "eq-002",
            "equipmentName", "Colete BalÃ­stico",
            "serialNumber", "CB001234",
            "expirationDate", "2025-01-30",
            "daysToExpire", 8,
            "status", "CRÃTICO",
            "assignedTo", "ALEX SANTOS",
            "lastMaintenance", "2025-01-05"
        ));
        
        return report;
    }

    public List<Map<String, Object>> generateGeneralReport(
            LocalDate startDate, LocalDate endDate, String status, String equipmentType) {
        log.info("Gerando relatÃ³rio geral de equipamentos");
        
        List<Map<String, Object>> report = new ArrayList<>();
        
        try {
            // Usar dados de exemplo realistas
            // TODO: Implementar queries especÃ­ficas quando necessÃ¡rio
            
            Map<String, Object> summary = Map.of(
                "totalEquipment", 150,
                "activeEquipment", 120,
                "inactiveEquipment", 20,
                "maintenanceEquipment", 10,
                "totalEmployees", 45,
                "equipmentTypes", Map.of(
                    "weapons", 25,
                    "uniforms", 60,
                    "radios", 35,
                    "other", 30
                ),
                "reportPeriod", Map.of(
                    "startDate", startDate != null ? startDate.toString() : "2025-01-01",
                    "endDate", endDate != null ? endDate.toString() : "2025-01-31"
                )
            );
            
            report.add(Map.of("summary", summary));
            
            // Detalhes por tipo
            report.add(Map.of(
                "equipmentType", "ARMAS",
                "total", 25,
                "active", 23,
                "inactive", 2,
                "details", List.of(
                    Map.of("name", "Pistola Glock 17", "status", "ATIVO", "assignedTo", "GIDELVAN SILVA"),
                    Map.of("name", "Pistola Taurus PT92", "status", "ATIVO", "assignedTo", "ALEX SANTOS")
                )
            ));
            
            report.add(Map.of(
                "equipmentType", "UNIFORMES",
                "total", 60,
                "active", 55,
                "inactive", 5,
                "details", List.of(
                    Map.of("name", "Uniforme Completo", "status", "ATIVO", "assignedTo", "GIDELVAN SILVA"),
                    Map.of("name", "Colete BalÃ­stico", "status", "ATIVO", "assignedTo", "ALEX SANTOS")
                )
            ));
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio geral de equipamentos", e);
        }
        
        return report;
    }

    public byte[] exportToPdf(Object reportRequest) {
        log.info("Exportando relatÃ³rio para PDF: {}", getReportType(reportRequest));
        
        try {
            // Gerar conteÃºdo HTML que pode ser convertido para PDF pelo navegador
            String htmlContent = generateHtmlReport(reportRequest);
            return htmlContent.getBytes(StandardCharsets.UTF_8);
            
        } catch (Exception e) {
            log.error("Erro ao gerar PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar PDF: " + e.getMessage());
        }
    }
    
    private String getReportType(Object reportRequest) {
        try {
            return (String) reportRequest.getClass().getMethod("getReportType").invoke(reportRequest);
        } catch (Exception e) {
            return "general_report";
        }
    }
    
    private LocalDate getStartDate(Object reportRequest) {
        try {
            return (LocalDate) reportRequest.getClass().getMethod("getStartDate").invoke(reportRequest);
        } catch (Exception e) {
            return null;
        }
    }
    
    private LocalDate getEndDate(Object reportRequest) {
        try {
            return (LocalDate) reportRequest.getClass().getMethod("getEndDate").invoke(reportRequest);
        } catch (Exception e) {
            return null;
        }
    }
    
    private String getStatus(Object reportRequest) {
        try {
            return (String) reportRequest.getClass().getMethod("getStatus").invoke(reportRequest);
        } catch (Exception e) {
            return null;
        }
    }
    
    private String getEquipmentType(Object reportRequest) {
        try {
            return (String) reportRequest.getClass().getMethod("getEquipmentType").invoke(reportRequest);
        } catch (Exception e) {
            return null;
        }
    }
    
    private String generateHtmlReport(Object reportRequest) {
        StringBuilder html = new StringBuilder();
        
        html.append("<!DOCTYPE html>");
        html.append("<html><head>");
        html.append("<meta charset='UTF-8'>");
        html.append("<title>RelatÃ³rio de Equipamentos</title>");
        html.append("<style>");
        html.append("body { font-family: Arial, sans-serif; margin: 20px; }");
        html.append("h1 { color: #dc2626; text-align: center; }");
        html.append("h2 { color: #374151; border-bottom: 2px solid #dc2626; }");
        html.append("table { width: 100%; border-collapse: collapse; margin: 20px 0; }");
        html.append("th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }");
        html.append("th { background-color: #f3f4f6; font-weight: bold; }");
        html.append(".info { background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0; }");
        html.append(".footer { text-align: center; font-size: 12px; color: #6b7280; margin-top: 30px; }");
        html.append("</style>");
        html.append("</head><body>");
        
        // CabeÃ§alho
        html.append("<h1>RELATÃ“RIO DE EQUIPAMENTOS</h1>");
        
        // InformaÃ§Ãµes do relatÃ³rio
        html.append("<div class='info'>");
        html.append("<h2>InformaÃ§Ãµes do RelatÃ³rio</h2>");
        html.append("<p><strong>Tipo:</strong> ").append(getReportTypeTitle(getReportType(reportRequest))).append("</p>");
        html.append("<p><strong>Data de GeraÃ§Ã£o:</strong> ").append(LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).append("</p>");
        
        LocalDate startDate = getStartDate(reportRequest);
        LocalDate endDate = getEndDate(reportRequest);
        
        if (startDate != null) {
            html.append("<p><strong>Data Inicial:</strong> ").append(startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).append("</p>");
        }
        if (endDate != null) {
            html.append("<p><strong>Data Final:</strong> ").append(endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).append("</p>");
        }
        html.append("</div>");
        
        // Dados do relatÃ³rio
        List<Map<String, Object>> reportData = generateReportDataSimple(getReportType(reportRequest), startDate, endDate, getStatus(reportRequest), getEquipmentType(reportRequest));
        
        if (!reportData.isEmpty()) {
            html.append("<h2>Dados do RelatÃ³rio</h2>");
            html.append(generateHtmlTable(reportData, getReportType(reportRequest)));
        } else {
            html.append("<p>Nenhum dado encontrado para o perÃ­odo especificado.</p>");
        }
        
        // RodapÃ©
        html.append("<div class='footer'>");
        html.append("<p>RelatÃ³rio gerado automaticamente pelo Sistema Secured Guard</p>");
        html.append("<p>Data: ").append(java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))).append("</p>");
        html.append("</div>");
        
        html.append("</body></html>");
        
        return html.toString();
    }
    
    private String generateHtmlTable(List<Map<String, Object>> data, String reportType) {
        StringBuilder table = new StringBuilder();
        table.append("<table>");
        
        switch (reportType) {
            case "equipment_by_employee":
                table.append("<tr><th>ID FuncionÃ¡rio</th><th>Nome</th><th>Total</th><th>Ativos</th><th>Inativos</th></tr>");
                for (Map<String, Object> row : data) {
                    table.append("<tr>");
                    table.append("<td>").append(row.get("employeeId")).append("</td>");
                    table.append("<td>").append(row.get("employeeName")).append("</td>");
                    table.append("<td>").append(row.get("totalEquipment")).append("</td>");
                    table.append("<td>").append(row.get("activeEquipment")).append("</td>");
                    table.append("<td>").append(row.get("inactiveEquipment")).append("</td>");
                    table.append("</tr>");
                }
                break;
                
            case "weapon_validity":
                table.append("<tr><th>ID</th><th>Nome</th><th>NÃºmero de SÃ©rie</th><th>Status</th></tr>");
                for (Map<String, Object> row : data) {
                    table.append("<tr>");
                    table.append("<td>").append(row.get("equipmentId")).append("</td>");
                    table.append("<td>").append(row.get("equipmentName")).append("</td>");
                    table.append("<td>").append(row.get("serialNumber")).append("</td>");
                    table.append("<td>").append(row.get("status")).append("</td>");
                    table.append("</tr>");
                }
                break;
                
            default:
                table.append("<tr><th>Campo 1</th><th>Campo 2</th><th>Campo 3</th></tr>");
                for (Map<String, Object> row : data) {
                    table.append("<tr>");
                    table.append("<td>").append(row.getOrDefault("field1", "N/A")).append("</td>");
                    table.append("<td>").append(row.getOrDefault("field2", "N/A")).append("</td>");
                    table.append("<td>").append(row.getOrDefault("field3", "N/A")).append("</td>");
                    table.append("</tr>");
                }
        }
        
        table.append("</table>");
        return table.toString();
    }

    private String getReportTypeTitle(String reportType) {
        switch (reportType) {
            case "equipment_by_employee": return "Equipamentos por FuncionÃ¡rio";
            case "weapon_validity": return "Validade de Armas";
            case "usage_report": return "RelatÃ³rio de Uso";
            case "expiration_report": return "RelatÃ³rio de Vencimento";
            case "general_report": return "RelatÃ³rio Geral";
            default: return "RelatÃ³rio de Equipamentos";
        }
    }
    
    private List<Map<String, Object>> generateReportDataSimple(String reportType, LocalDate startDate, LocalDate endDate, String status, String equipmentType) {
        switch (reportType) {
            case "equipment_by_employee":
                return generateEquipmentByEmployeeReport(startDate, endDate, status, equipmentType);
            case "weapon_validity":
                return generateWeaponValidityReport(startDate, endDate);
            case "usage_report":
                return generateUsageReport(startDate, endDate);
            case "expiration_report":
                return generateExpirationReport(startDate, endDate);
            case "general_report":
                return generateGeneralReport(startDate, endDate, status, equipmentType);
            default:
                return new ArrayList<>();
        }
    }

    public byte[] exportToExcel(Object reportRequest) {
        log.info("Exportando relatÃ³rio para Excel: {}", getReportType(reportRequest));

        try {
            String csvContent = generateCsvContent(reportRequest);
            return csvContent.getBytes(StandardCharsets.UTF_8);

        } catch (Exception e) {
            log.error("Erro ao gerar Excel: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar Excel: " + e.getMessage());
        }
    }

    public byte[] exportToCsv(Object reportRequest) {
        log.info("Exportando relatÃ³rio para CSV: {}", getReportType(reportRequest));

        try {
            String csvContent = generateCsvContent(reportRequest);
            return csvContent.getBytes(StandardCharsets.UTF_8);

        } catch (Exception e) {
            log.error("Erro ao gerar CSV: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar CSV: " + e.getMessage());
        }
    }

    private String generateCsvContent(Object reportRequest) {
        StringBuilder csv = new StringBuilder();
        
        List<Map<String, Object>> reportData = generateReportDataSimple(
            getReportType(reportRequest), 
            getStartDate(reportRequest), 
            getEndDate(reportRequest), 
            getStatus(reportRequest), 
            getEquipmentType(reportRequest)
        );

        if (reportData.isEmpty()) {
            return "Nenhum dado encontrado para o perÃ­odo especificado.";
        }

        // Headers
        Set<String> headers = new LinkedHashSet<>();
        for (Map<String, Object> row : reportData) {
            headers.addAll(row.keySet());
        }
        
        csv.append(String.join(",", headers)).append("\n");

        // Rows
        for (Map<String, Object> row : reportData) {
            List<String> values = new ArrayList<>();
            for (String header : headers) {
                Object value = row.getOrDefault(header, "");
                values.add("\"" + value.toString().replace("\"", "\"\"") + "\"");
            }
            csv.append(String.join(",", values)).append("\n");
        }

        return csv.toString();
    }

} 
