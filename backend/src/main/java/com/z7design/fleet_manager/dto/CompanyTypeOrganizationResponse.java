package com.z7design.fleet_manager.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CompanyTypeOrganizationResponse {

    private LocalDateTime generatedAt;
    private long totalPayslips;
    private int totalCompanies;
    private int totalSectors;
    
    // OrganizaÃ§Ã£o por tipo de empresa
    private CompanyTypeGroup terceirizacao;
    private CompanyTypeGroup vigilancia;
    private CompanyTypeGroup administrativo;

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CompanyTypeGroup {
        private String typeName;
        private String typeCode; // "TERCEIRIZACAO", "VIGILANCIA" ou "ADMINISTRATIVO"
        private int totalCompanies;
        private long totalPayslips;
        private int totalSectors;
        private List<CompanyGroup> companies;
    }

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CompanyGroup {
        private java.util.UUID companyId;
        private String companySigla;
        private String companyName;
        private String companyCnpj;
        private long totalPayslips;
        private int totalSectors;
        private List<SectorGroup> sectors;
    }

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SectorGroup {
        private String sectorName;
        private String normalizedSectorName;
        private long totalPayslips;
        private List<PeriodGroup> periods;
    }

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PeriodGroup {
        private int month;
        private int year;
        private String formattedPeriod;
        private long totalPayslips;
        private List<PayslipEntry> payslips;
    }

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PayslipEntry {
        private java.util.UUID id;
        private String employeeName;
        private String cpf;
        private Integer month;
        private Integer year;
        private String fileName;
        private String companySigla;
        private String companyName;
        private String companyCnpj;
        private String sectorName;
        private String workPostName;
        private LocalDateTime processedAt;
    }
}


