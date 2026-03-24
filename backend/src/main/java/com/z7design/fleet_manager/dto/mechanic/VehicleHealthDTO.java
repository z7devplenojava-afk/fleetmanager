package com.z7design.fleet_manager.dto.mechanic;

import com.z7design.fleet_manager.dto.VehicleDTO;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class VehicleHealthDTO {
    private VehicleDTO vehicle;
    private List<MechanicTaskDTO> activeAlerts;
    private List<MechanicTaskDTO> recentWorkOrders;
    private String healthStatus; // "CRITICAL", "WARNING", "OK"
    private Double lastMileage;
}
