package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.GarageMovement;
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
public class GarageMovementDTO {

    private UUID id;
    private UUID vehicleId;
    private String vehiclePlate;
    private UUID fromGarageId;
    private String fromGarageName;
    private UUID toGarageId;
    private String toGarageName;
    private String reason;
    private String reasonDetail;
    private UUID performedBy;
    private String performedByName;
    private Integer kmReading;
    private UUID companyId;
    private LocalDateTime createdAt;

    public static GarageMovementDTO fromEntity(GarageMovement m) {
        if (m == null) return null;
        return GarageMovementDTO.builder()
                .id(m.getId())
                .vehicleId(m.getVehicle() != null ? m.getVehicle().getId() : null)
                .vehiclePlate(m.getVehiclePlate())
                .fromGarageId(m.getFromGarage() != null ? m.getFromGarage().getId() : null)
                .fromGarageName(m.getFromGarageName())
                .toGarageId(m.getToGarage() != null ? m.getToGarage().getId() : null)
                .toGarageName(m.getToGarageName())
                .reason(m.getReason())
                .reasonDetail(m.getReasonDetail())
                .performedBy(m.getPerformedBy())
                .performedByName(m.getPerformedByName())
                .kmReading(m.getKmReading())
                .companyId(m.getCompanyId())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
