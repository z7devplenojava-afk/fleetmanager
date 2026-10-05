package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.EscalaOperacional;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Representacao plana de uma escala operacional para a UI
 * (nomes de linha/veiculo/motorista resolvidos no servidor).
 */
@Data
@Builder
public class EscalaOperacionalDTO {

    private UUID id;
    private LocalDate scaleDate;
    private UUID routeId;
    private String routeName;
    private String routeColor;
    private Integer routeCapacity;
    private Long estimatedDurationMinutes;
    private UUID timeSlotId;
    private LocalTime departureTime;
    private UUID vehicleId;
    private String vehiclePlate;
    private String vehicleStatus;
    private Integer vehiclePassengerCapacity;
    private UUID driverId;
    private String driverName;
    private String driverStatus;
    private String status;
    private String origin;
    private UUID tripId;
    private LocalDateTime createdAt;

    public static EscalaOperacionalDTO from(EscalaOperacional escala) {
        return EscalaOperacionalDTO.builder()
                .id(escala.getId())
                .scaleDate(escala.getScaleDate())
                .routeId(escala.getRoute() != null ? escala.getRoute().getId() : null)
                .routeName(escala.getRoute() != null ? escala.getRoute().getName() : null)
                .routeColor(escala.getRoute() != null ? escala.getRoute().getColor() : null)
                .routeCapacity(escala.getRoute() != null ? escala.getRoute().getCapacity() : null)
                .estimatedDurationMinutes(escala.getRoute() != null && escala.getRoute().getEstimatedDuration() != null
                        ? escala.getRoute().getEstimatedDuration().toMinutes()
                        : null)
                .timeSlotId(escala.getTimeSlot() != null ? escala.getTimeSlot().getId() : null)
                .departureTime(escala.getDepartureTime())
                .vehicleId(escala.getVehicle() != null ? escala.getVehicle().getId() : null)
                .vehiclePlate(escala.getVehicle() != null ? escala.getVehicle().getPlate() : null)
                .vehicleStatus(escala.getVehicle() != null && escala.getVehicle().getStatus() != null
                        ? escala.getVehicle().getStatus().name()
                        : null)
                .vehiclePassengerCapacity(escala.getVehicle() != null ? escala.getVehicle().getPassengerCapacity() : null)
                .driverId(escala.getDriver() != null ? escala.getDriver().getId() : null)
                .driverName(escala.getDriver() != null ? escala.getDriver().getName() : null)
                .driverStatus(escala.getDriver() != null ? escala.getDriver().getStatus() : null)
                .status(escala.getStatus())
                .origin(escala.getOrigin())
                .tripId(escala.getTripId())
                .createdAt(escala.getCreatedAt())
                .build();
    }
}
