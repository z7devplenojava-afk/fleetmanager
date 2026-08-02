package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleMaintenanceRankingDTO {
    private UUID vehicleId;
    private String vehiclePlate;
    private String vehicleModel;
    private long totalOrders;
    private long completedOrders;
    private long cancelledOrders;
    private BigDecimal totalCost;
    private Long totalDowntimeHours;
    /** Percentual de aproveitamento: (completedOrders / totalOrders) * 100 */
    private double completionRate;
    /** Recomendação: KEEP, REVIEW, RETIRE */
    private String recommendation;
}
