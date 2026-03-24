package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.VehicleGateChecklist;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleGateChecklistDTO {

    private UUID id;
    private UUID vehicleId;
    private String vehiclePlate;
    private UUID driverId;
    private String driverName;
    private VehicleGateChecklist.ChecklistType type;
    private LocalDateTime occurredAt;
    private Integer kmReading;
    private String odometerPhotoUrl;
    private String odometerPhotoDescription;
    private String checklistData;
    private String driverProblemReport;
    private String observations;
    private String vehiclePhotos;
    private UUID companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
