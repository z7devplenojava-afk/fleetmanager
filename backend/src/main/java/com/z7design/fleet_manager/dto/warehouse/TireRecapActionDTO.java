package com.z7design.fleet_manager.dto.warehouse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TireRecapActionDTO {
    private String recapVendor;
    private BigDecimal recapCost;
    private BigDecimal treadDepthMm;
    private Integer mileage;
    private String scrapReason;
    private String locationNotes;
    private String notes;
}

