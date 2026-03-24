package com.z7design.fleet_manager.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PayslipOrganizationResponse {

    private LocalDateTime generatedAt;
    private long totalPayslips;
    private int totalCompanies;
    private int totalSectors;
    private List<CompanyGroup> companies;

    @Data
    public static class CompanyGroup {
        private UUID companyId;
        private String companySigla;
        private String companyName;
        private String companyCnpj;
        private long totalPayslips;
        private List<SectorGroup> sectors;
    }

    @Data
    public static class SectorGroup {
        private String sectorName;
        private String normalizedSectorName;
        private long totalPayslips;
        private List<PeriodGroup> periods;
    }

    @Data
    public static class PeriodGroup {
        private int month;
        private int year;
        private String formattedPeriod;
        private long totalPayslips;
        private List<PayslipEntry> payslips;
    }

    @Data
    public static class PayslipEntry {
        private UUID id;
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



