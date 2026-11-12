package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.FleetComponentControlConfig;
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
public class FleetComponentControlDashboardDTO {
    private FleetComponentControlConfig config;
    private int totalRows;
    private int overdueCount;
    private int dueSoonCount;
    private int okCount;

    @Builder.Default
    private List<FleetComponentControlRowDTO> rows = new ArrayList<>();

    @Builder.Default
    private List<FleetComponentControlRowDTO> expiringAlerts = new ArrayList<>();
}

