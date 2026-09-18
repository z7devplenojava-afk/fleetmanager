package com.z7design.fleet_manager.dto.procurement;

import com.z7design.fleet_manager.model.ProcurementQuoteComparison;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcurementQuoteComparisonDTO {
    private UUID id;
    private UUID companyId;
    private UUID requisitionId;
    private String requisitionNumber;
    private String itemName;
    private String itemCode;
    private BigDecimal quantity;
    private String unit;
    private String urgency;
    private String vehiclePlate;
    private String workOrderNumber;
    private String comparisonNumber;
    private ProcurementQuoteComparison.ComparisonStatus status;
    private UUID systemRecommendedOptionId;
    private String systemRecommendationReason;
    private UUID chosenOptionId;
    private String overrideReason;
    private UUID approvedById;
    private String approvedByName;
    private LocalDateTime approvedAt;
    private LocalDateTime createdAt;

    @Builder.Default
    private List<ProcurementQuoteOptionDTO> options = new ArrayList<>();
}
