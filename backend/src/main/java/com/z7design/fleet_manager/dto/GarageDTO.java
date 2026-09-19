package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.Garage;
import com.z7design.fleet_manager.model.Vehicle;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GarageDTO {

    private UUID id;
    private String name;
    private String address;
    private UUID responsibleEmployeeId;
    private String responsibleName;
    private String responsiblePhone;
    private Integer capacity;
    private String notes;
    private UUID companyId;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Quantidade de veículos alocados na garagem. */
    @Builder.Default
    private Long vehicleCount = 0L;

    /** Taxa de ocupação em % (vehicleCount / capacity). null = sem capacidade definida. */
    private Double occupancyRate;

    /** true quando a ocupação atingiu 100% da capacidade. */
    @Builder.Default
    private Boolean atCapacity = false;

    /** true quando a ocupação está na zona de alerta (>= 90%). */
    @Builder.Default
    private Boolean nearCapacity = false;

    /** Contagem de veículos por status na garagem (ex.: MAINTENANCE -> 3). */
    @Builder.Default
    private Map<String, Long> statusBreakdown = Map.of();

    /** Resumo dos veículos alocados (id, placa, modelo, KM). */
    @Builder.Default
    private List<VehicleSummary> vehicles = List.of();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VehicleSummary {
        private UUID id;
        private String plate;
        private String model;
        private String brand;
        private Integer currentMileage;
        private String status;
        private String assignedDriver;
        private String clientName;
        private String vehicleType;
        private String entryDate;
        private String entryTime;
        private Long stayDurationMinutes;
        private String stayDurationFormatted;
        private String reason;
    }

    public static GarageDTO fromEntity(Garage garage) {
        return fromEntity(garage, List.of());
    }

    public static GarageDTO fromEntity(Garage garage, List<Vehicle> vehicles) {
        if (garage == null) return null;
        GarageDTO dto = GarageDTO.builder()
                .id(garage.getId())
                .name(garage.getName())
                .address(garage.getAddress())
                .responsibleEmployeeId(garage.getResponsibleEmployee() != null
                        ? garage.getResponsibleEmployee().getId() : null)
                .responsibleName(garage.getResponsibleName())
                .responsiblePhone(garage.getResponsiblePhone())
                .capacity(garage.getCapacity())
                .notes(garage.getNotes())
                .companyId(garage.getCompanyId())
                .active(garage.getActive())
                .createdAt(garage.getCreatedAt())
                .updatedAt(garage.getUpdatedAt())
                .build();
        if (vehicles != null) {
            dto.setVehicleCount((long) vehicles.size());
            dto.setVehicles(vehicles.stream()
                    .map(v -> {
                        String client = v.getProjectName() != null && !v.getProjectName().isBlank()
                                ? v.getProjectName()
                                : (v.getOperationName() != null && !v.getOperationName().isBlank()
                                        ? v.getOperationName()
                                        : (v.getWorkPostEntity() != null ? v.getWorkPostEntity().getName() : "Reserva Operacional"));
                        return VehicleSummary.builder()
                                .id(v.getId())
                                .plate(v.getPlate())
                                .model(v.getModel())
                                .brand(v.getBrand())
                                .currentMileage(v.getCurrentMileage())
                                .status(v.getStatus() != null ? v.getStatus().name() : null)
                                .assignedDriver(v.getAssignedDriver())
                                .clientName(client)
                                .vehicleType(v.getVehicleType() != null ? v.getVehicleType().name() : null)
                                .entryDate(v.getOperationEntryDate() != null ? v.getOperationEntryDate().toString() : null)
                                .build();
                    })
                    .toList());
            dto.setStatusBreakdown(vehicles.stream()
                    .filter(v -> v.getStatus() != null)
                    .collect(java.util.stream.Collectors.groupingBy(
                            v -> v.getStatus().name(), java.util.stream.Collectors.counting())));
            if (garage.getCapacity() != null && garage.getCapacity() > 0) {
                double rate = Math.min(100.0,
                        Math.round(vehicles.size() * 1000.0 / garage.getCapacity()) / 10.0);
                dto.setOccupancyRate(rate);
                dto.setAtCapacity(vehicles.size() >= garage.getCapacity());
                dto.setNearCapacity(rate >= 90.0);
            }
        }
        return dto;
    }
}
