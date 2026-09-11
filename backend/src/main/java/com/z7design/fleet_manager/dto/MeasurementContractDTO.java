package com.z7design.fleet_manager.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class MeasurementContractDTO {
    private UUID id;
    private UUID companyId;
    private UUID clientId;
    private String clientName;
    private String contractNumber;
    private String obraName;
    private String description;
    private String billingType;
    private String periodicity;
    private Integer baseDays;
    private Integer startDayOfMonth;
    private Integer endDayOfMonth;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private String notes;
    private List<MeasurementContractPriceDTO> prices;
}
