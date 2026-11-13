package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemAlertCenterResponseDTO {
    private int totalCount;
    private int criticalCount;
    private int highCount;
    private int mediumCount;
    private int lowCount;
    private int vehicleCount;
    private int driverCount;
    private int companyCount;
    private int financialCount;
    private int rhCount;

    @Builder.Default
    private List<String> visibleScopes = new ArrayList<>();

    @Builder.Default
    private List<SystemAlertItemDTO> alerts = new ArrayList<>();
}

