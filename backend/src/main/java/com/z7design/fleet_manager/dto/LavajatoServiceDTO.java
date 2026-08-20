package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.LavajatoService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LavajatoServiceDTO {

    private UUID id;
    private UUID vehicleId;
    private String vehiclePlate;
    private String vehicleModel;
    private String vehicleBrand;
    private String vehicleColor;
    private String vehiclePhotoUrl;
    private UUID driverId;
    private String driverName;
    private LavajatoService.LavajatoStatus status;
    private String checklistInternal;
    private String checklistExternal;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private Long durationSeconds;
    private String observations;
    private String driverPhone;
    private UUID driverUserId;
    private UUID operatorId;
    private String operatorName;
    private UUID companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
