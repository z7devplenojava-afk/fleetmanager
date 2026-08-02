package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.VehicleChecklistConfig;
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
public class VehicleChecklistConfigDTO {

    private UUID id;
    private UUID vehicleId;
    private String title;
    private String category;
    private Boolean required;
    private Integer sortOrder;
    private Boolean isActive;
    private UUID companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static VehicleChecklistConfigDTO fromEntity(VehicleChecklistConfig entity) {
        if (entity == null) {
            return null;
        }
        return VehicleChecklistConfigDTO.builder()
                .id(entity.getId())
                .vehicleId(entity.getVehicle() != null ? entity.getVehicle().getId() : null)
                .title(entity.getTitle())
                .category(entity.getCategory())
                .required(entity.getRequired())
                .sortOrder(entity.getSortOrder())
                .isActive(entity.getIsActive())
                .companyId(entity.getCompanyId())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
