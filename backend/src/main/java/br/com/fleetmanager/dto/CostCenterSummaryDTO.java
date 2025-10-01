package br.com.fleetmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostCenterSummaryDTO {
    
    private Long totalCenters;
    
    private Long activeCenters;
    
    private Long inactiveCenters;
    
    private Long suspendedCenters;
    
    private BigDecimal totalBudget;
    
    private BigDecimal totalSpent;
    
    private BigDecimal totalAvailable;
    
    private BigDecimal averageUtilization;
    
    private List<CostCenterDTO> topUtilizedCenters;
    
    private List<CostCenterDTO> overBudgetCenters;
    
    private List<CostCenterDTO> nearBudgetLimitCenters;
}
