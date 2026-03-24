package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentReportDTO {
    
    private String reportType;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private String equipmentType;
    private String exportFormat;
    private Map<String, Object> filters;
    
    // Tipos de relatÃ³rio disponÃ­veis
    public enum ReportType {
        EQUIPMENT_BY_EMPLOYEE("equipment_by_employee", "Equipamentos por FuncionÃ¡rio"),
        WEAPON_VALIDITY("weapon_validity", "Validade de Armas"),
        USAGE_REPORT("usage_report", "RelatÃ³rio de Uso"),
        EXPIRATION_REPORT("expiration_report", "RelatÃ³rio de Vencimento"),
        GENERAL_REPORT("general_report", "RelatÃ³rio Geral");
        
        private final String code;
        private final String description;
        
        ReportType(String code, String description) {
            this.code = code;
            this.description = description;
        }
        
        public String getCode() {
            return code;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    // Formatos de exportaÃ§Ã£o disponÃ­veis
    public enum ExportFormat {
        PDF("pdf", "PDF"),
        EXCEL("excel", "Excel"),
        CSV("csv", "CSV");
        
        private final String code;
        private final String description;
        
        ExportFormat(String code, String description) {
            this.code = code;
            this.description = description;
        }
        
        public String getCode() {
            return code;
        }
        
        public String getDescription() {
            return description;
        }
    }
}
