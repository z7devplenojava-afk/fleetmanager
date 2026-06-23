package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.TransportMobilization;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransportMobilizationDTO {

    private UUID id;
    private UUID vehicleId;
    private String vehiclePlate;
    private UUID driverId;
    private String driverName;
    private TransportMobilization.MobilizationType type;
    private LocalDateTime occurredAt;
    private Integer kmReading;
    private String odometerPhotoUrl;
    private String jsonData;
    private String checklistData;
    private String damageData;
    private String partsRequestData;
    private String descricaoAvaria;
    private String observations;
    private String photos;
    private UUID companyId;
    private TransportMobilization.SyncStatus syncStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
