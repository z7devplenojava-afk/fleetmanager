package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.MaintenancePlan;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenancePlanDTO {

    private UUID id;
    private UUID vehicleId;
    private String vehiclePlate;
    private String taskName;
    private Integer intervalKm;
    private Integer intervalDays;
    private Integer lastExecutionKm;
    private LocalDate lastExecutionDate;
    private Integer nextDueKm;
    private LocalDate nextDueDate;
    private Boolean isActive;
    private UUID companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MaintenancePlanDTO fromEntity(MaintenancePlan entity) {
        if (entity == null)
            return null;
        return MaintenancePlanDTO.builder()
                .id(entity.getId())
                .vehicleId(entity.getVehicle() != null ? entity.getVehicle().getId() : null)
                .vehiclePlate(entity.getVehicle() != null ? entity.getVehicle().getPlate() : null)
                .taskName(entity.getTaskName())
                .intervalKm(entity.getIntervalKm())
                .intervalDays(entity.getIntervalDays())
                .lastExecutionKm(entity.getLastExecutionKm())
                .lastExecutionDate(entity.getLastExecutionDate())
                .nextDueKm(entity.getNextDueKm())
                .nextDueDate(entity.getNextDueDate())
                .isActive(entity.getIsActive())
                .companyId(entity.getCompanyId())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
