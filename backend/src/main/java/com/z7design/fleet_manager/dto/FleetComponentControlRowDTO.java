package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FleetComponentControlRowDTO {
    private UUID id;
    private UUID vehicleId;
    private String fleetNumber;
    private String plate;
    private String model;
    private String controlType; // ALIGNMENT | ENGINE_OIL | PULLEY_BEARING | STARTER | ALTERNATOR
    private String controlLabel;
    private UUID workOrderId;
    private String osNumber;
    private LocalDate serviceDate;
    private Integer serviceKm;
    private Integer currentKm;
    private Integer nextDueKm;
    private Integer kmRemaining; // nextDueKm - currentKm (negativo = vencido)
    private Integer intervalKm;
    private Boolean oilFilterChanged;
    private Boolean dieselFilterChanged;
    private Boolean waterSeparatorFilterChanged;
    private Boolean airFilterChanged;
    private String alertStatus; // OVERDUE | DUE_SOON | OK
    private Boolean hasHistory;
    private String notes;
}

