package com.z7design.fleet_manager.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class MeasurementContractPriceDTO {
    private UUID id;
    private UUID contractId;
    private String vehicleType;
    private String serviceName;
    private BigDecimal monthlyPrice;
    private BigDecimal dailyPrice;
    private BigDecimal kmExtraPrice;
    private LocalDate startValidity;
    private LocalDate endValidity;
}
