package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalCertificateStatsDTO {
    private long totalCertificates;
    private long activeToday;
    private long daysThisMonth;
    private BigDecimal hoursThisMonth;
    private long pendingApproval;
}
