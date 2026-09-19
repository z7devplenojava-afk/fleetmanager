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

    private String movementType;
    private String driverName;
    private String clientName;
    private LocalDateTime entryTime;
    private LocalDateTime exitTime;
    private Long stayDurationMinutes;
    private Boolean activeStay;
    private String stayDurationFormatted;

    public static String formatDuration(Long minutes) {
        if (minutes == null || minutes < 0) return "—";
        if (minutes < 60) return minutes + " min";
        long hours = minutes / 60;
        long remainingMinutes = minutes % 60;
        if (hours < 24) {
            return remainingMinutes > 0 ? hours + "h " + remainingMinutes + "min" : hours + "h";
        }
        long days = hours / 24;
        long remainingHours = hours % 24;
        return remainingHours > 0 ? days + "d " + remainingHours + "h" : days + " dias";
    }

    public static GarageMovementDTO fromEntity(GarageMovement m) {
        if (m == null) return null;
        Long duration = m.getStayDurationMinutes();
        if (duration == null && m.getEntryTime() != null) {
            LocalDateTime end = m.getExitTime() != null ? m.getExitTime() : LocalDateTime.now();
            duration = java.time.Duration.between(m.getEntryTime(), end).toMinutes();
        }

        return GarageMovementDTO.builder()
                .id(m.getId())
                .vehicleId(m.getVehicle() != null ? m.getVehicle().getId() : null)
                .vehiclePlate(m.getVehiclePlate())
                .fromGarageId(m.getFromGarage() != null ? m.getFromGarage().getId() : null)
                .fromGarageName(m.getFromGarageName())
                .toGarageId(m.getToGarage() != null ? m.getToGarage().getId() : null)
                .toGarageName(m.getToGarageName())
                .movementType(m.getMovementType())
                .driverName(m.getDriverName())
                .clientName(m.getClientName())
                .entryTime(m.getEntryTime())
                .exitTime(m.getExitTime())
                .stayDurationMinutes(duration)
                .stayDurationFormatted(formatDuration(duration))
                .activeStay(m.getActiveStay())
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
