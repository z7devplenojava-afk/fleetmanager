package com.z7design.fleet_manager.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.UUID;
import com.z7design.fleet_manager.model.Payslip;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayslipDTO {
    private UUID id;
    private YearMonth referenceMonth;
    private LocalDate paymentDate;
    private BigDecimal grossSalary;
    private BigDecimal netSalary;
    private BigDecimal totalDiscounts;
    private BigDecimal totalBenefits;
    private BigDecimal totalAdditions;
    private Integer workedDays;
    private Integer absentDays;
    private Integer overtimeHours;
    private String status;
    private LocalDate createdAt;
    private String observations;

    public static PayslipDTO fromEntity(Payslip payslip) {
        if (payslip == null) return null;
        
        LocalDate processedDate = payslip.getProcessedAt() != null ? payslip.getProcessedAt().toLocalDate() : null;
        
        return PayslipDTO.builder()
                .id(payslip.getId())
                .referenceMonth(YearMonth.of(payslip.getYear(), payslip.getMonth()))
                .paymentDate(processedDate)
                .grossSalary(payslip.getTotalEarnings())
                .netSalary(payslip.getNetValue())
                .totalDiscounts(payslip.getTotalDeductions())
                .totalBenefits(BigDecimal.ZERO)
                .totalAdditions(payslip.getTotalEarnings())
                .workedDays(30)
                .absentDays(0)
                .overtimeHours(0)
                .status("ENVIADO")
                .createdAt(processedDate)
                .observations(payslip.getFileName())
                .build();
    }
}
