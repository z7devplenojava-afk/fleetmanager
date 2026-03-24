package com.z7design.fleet_manager.dto.mechanic;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class MechanicTaskDTO {
    private UUID id;
    private String type; // "WORK_ORDER" or "ALERT"
    private String title; // "Troca de Óleo" or "Barulho no Motor"
    private String vehiclePlate;
    private String vehicleFleetNumber; // Fleet number for easier ID
    private String vehicleBrand;
    private String vehicleModel;
    private String priority; // HIGH, MEDIUM, LOW
    private String status; // TODO, IN_PROGRESS, DONE
    private LocalDateTime createdAt;
    private String description;
    private UUID vehicleId; // For opening Hangar view
}
