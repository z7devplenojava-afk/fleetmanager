package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientChecklistRecordDTO {

    private UUID id;
    private UUID templateId;
    private String templateName;
    private UUID clientId;
    private String clientName;
    private UUID vehicleId;
    private String vehiclePlate;
    private UUID driverId;
    private String driverName;
    private LocalDateTime occurredAt;
    private Integer kmReading;
    private Map<String, String> responses;
    private String observations;
    private Boolean equipmentReleased;
    private String odometerPhotoUrl;
    private String odometerPhotoDescription;
    private String vehiclePhotos;
    private String inspectorName;
    private String inspectorSignature;
    private String driverSignature;
    private UUID companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
