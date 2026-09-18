package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.VehicleCleaningOrder;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleCleaningOrderDTO {

    private UUID id;
    private UUID vehicleId;
    private String vehiclePlate;
    private String vehicleModel;
    private String vehicleGarageName;
    private UUID driverId;
    private String driverName;
    private VehicleCleaningOrder.CleaningStatus status;
    private VehicleCleaningOrder.CleaningType cleaningType;
    private String checklistData;
    private String observations;
    private String driverPhone;
    private UUID driverUserId;
    private UUID requestedBy;
    private String requestedByName;
    private VehicleCleaningOrder.RequesterSector requesterSector;
    private VehicleCleaningOrder.Priority priority;
    private VehicleCleaningOrder.CleaningPhase phase;
    private LocalDateTime releaseDeadline;
    private LocalDateTime estimatedCompletion;
    private LocalDateTime startedAt;
    private VehicleCleaningOrder.CleaningPhase currentPhase;
    private Integer standardTimeMinutes;
    private Boolean delayAlertSent;
    private Boolean qualityApproved;
    private String qualityInspectedBy;
    private LocalDateTime qualityInspectedAt;
    private String qualityChecklist;
    private String releaseSpot;
    private LocalDateTime releasedAt;
    private LocalDateTime completedAt;
    private UUID companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
