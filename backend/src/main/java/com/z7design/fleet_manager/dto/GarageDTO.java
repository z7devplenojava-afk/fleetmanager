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
        private UUID movementId;
        private String plate;
        private String model;
        private String brand;
        private Integer currentMileage;
        private String status;
        private String assignedDriver;
        private String driverName;
        private String clientName;
        private String vehicleType;
        private String entryDate;
        private String entryTime;
        private String exitDate;
        private String exitTime;
        private String workSchedule;
        private Boolean isTemporary;
        private Boolean activeStay;
        private Long stayDurationMinutes;
        private String stayDurationFormatted;
        private String reason;
        private String reasonDetail;
    }

    public static GarageDTO fromEntity(Garage garage) {
        return fromEntity(garage, List.of(), List.of());
    }

    public static GarageDTO fromEntity(Garage garage, List<Vehicle> vehicles) {
        return fromEntity(garage, vehicles, List.of());
    }

    public static GarageDTO fromEntity(Garage garage, List<Vehicle> vehicles, List<com.z7design.fleet_manager.model.GarageMovement> movements) {
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

        java.util.Map<UUID, com.z7design.fleet_manager.model.GarageMovement> latestMovementByVehicle = new java.util.HashMap<>();
        if (movements != null) {
            for (com.z7design.fleet_manager.model.GarageMovement m : movements) {
                if (m.getVehicle() != null && m.getVehicle().getId() != null) {
                    latestMovementByVehicle.putIfAbsent(m.getVehicle().getId(), m);
                }
            }
        }

        java.util.List<VehicleSummary> summaries = new java.util.ArrayList<>();
        java.util.Set<UUID> seenVehicles = new java.util.HashSet<>();

        if (vehicles != null) {
            for (Vehicle v : vehicles) {
                if (v == null || v.getId() == null) continue;
                seenVehicles.add(v.getId());
                com.z7design.fleet_manager.model.GarageMovement mov = latestMovementByVehicle.get(v.getId());

                String client = (mov != null && mov.getClientName() != null && !mov.getClientName().isBlank())
                        ? mov.getClientName()
                        : (v.getProjectName() != null && !v.getProjectName().isBlank()
                                ? v.getProjectName()
                                : (v.getOperationName() != null && !v.getOperationName().isBlank()
                                        ? v.getOperationName()
                                        : (v.getWorkPostEntity() != null ? v.getWorkPostEntity().getName() : "Reserva Operacional")));

                String driver = (mov != null && mov.getDriverName() != null && !mov.getDriverName().isBlank())
                        ? mov.getDriverName()
                        : v.getAssignedDriver();

                LocalDateTime entryDt = mov != null && mov.getEntryTime() != null
                        ? mov.getEntryTime()
                        : (mov != null ? mov.getCreatedAt() : null);
                LocalDateTime exitDt = mov != null ? mov.getExitTime() : null;

                Long durationMin = mov != null ? mov.getStayDurationMinutes() : null;
                if (durationMin == null && entryDt != null) {
                    LocalDateTime end = exitDt != null ? exitDt : LocalDateTime.now();
                    durationMin = Math.max(0L, java.time.Duration.between(entryDt, end).toMinutes());
                }

                String entryDateStr = entryDt != null
                        ? entryDt.toLocalDate().toString()
                        : (v.getOperationEntryDate() != null ? v.getOperationEntryDate().toString() : null);
                String entryTimeStr = entryDt != null ? entryDt.toString() : null;
                String exitDateStr = exitDt != null ? exitDt.toLocalDate().toString() : null;
                String exitTimeStr = exitDt != null ? exitDt.toString() : null;

                summaries.add(VehicleSummary.builder()
                        .id(v.getId())
                        .movementId(mov != null ? mov.getId() : null)
                        .plate(v.getPlate())
                        .model(v.getModel())
                        .brand(v.getBrand())
                        .currentMileage(v.getCurrentMileage())
                        .status(v.getStatus() != null ? v.getStatus().name() : null)
                        .assignedDriver(v.getAssignedDriver())
                        .driverName(driver)
                        .clientName(client)
                        .vehicleType(v.getVehicleType() != null ? v.getVehicleType().name() : null)
                        .entryDate(entryDateStr)
                        .entryTime(entryTimeStr)
                        .exitDate(exitDateStr)
                        .exitTime(exitTimeStr)
                        .workSchedule(mov != null ? mov.getWorkSchedule() : null)
                        .isTemporary(mov != null && Boolean.TRUE.equals(mov.getIsTemporary()))
                        .activeStay(mov == null || !Boolean.FALSE.equals(mov.getActiveStay()))
                        .stayDurationMinutes(durationMin)
                        .stayDurationFormatted(GarageMovementDTO.formatDuration(durationMin))
                        .reason(mov != null ? mov.getReason() : "RECOLHIMENTO")
                        .reasonDetail(mov != null ? mov.getReasonDetail() : null)
                        .build());
            }
        }

        // Também inclui veículos com estadia ativa/temporária na garagem via movimentação mesmo se garageId no veículo divergir
        if (movements != null) {
            for (com.z7design.fleet_manager.model.GarageMovement mov : movements) {
                Vehicle v = mov.getVehicle();
                if (v == null || v.getId() == null || seenVehicles.contains(v.getId())) continue;
                if (!Boolean.TRUE.equals(mov.getActiveStay()) && !Boolean.TRUE.equals(mov.getIsTemporary())) continue;
                seenVehicles.add(v.getId());

                LocalDateTime entryDt = mov.getEntryTime() != null ? mov.getEntryTime() : mov.getCreatedAt();
                LocalDateTime exitDt = mov.getExitTime();
                Long durationMin = mov.getStayDurationMinutes();
                if (durationMin == null && entryDt != null) {
                    LocalDateTime end = exitDt != null ? exitDt : LocalDateTime.now();
                    durationMin = Math.max(0L, java.time.Duration.between(entryDt, end).toMinutes());
                }

                summaries.add(VehicleSummary.builder()
                        .id(v.getId())
                        .movementId(mov.getId())
                        .plate(v.getPlate() != null ? v.getPlate() : mov.getVehiclePlate())
                        .model(v.getModel())
                        .brand(v.getBrand())
                        .currentMileage(mov.getKmReading() != null ? mov.getKmReading() : v.getCurrentMileage())
                        .status(v.getStatus() != null ? v.getStatus().name() : null)
                        .assignedDriver(v.getAssignedDriver())
                        .driverName(mov.getDriverName() != null ? mov.getDriverName() : v.getAssignedDriver())
                        .clientName(mov.getClientName() != null ? mov.getClientName() : v.getProjectName())
                        .vehicleType(v.getVehicleType() != null ? v.getVehicleType().name() : null)
                        .entryDate(entryDt != null ? entryDt.toLocalDate().toString() : null)
                        .entryTime(entryDt != null ? entryDt.toString() : null)
                        .exitDate(exitDt != null ? exitDt.toLocalDate().toString() : null)
                        .exitTime(exitDt != null ? exitDt.toString() : null)
                        .workSchedule(mov.getWorkSchedule())
                        .isTemporary(Boolean.TRUE.equals(mov.getIsTemporary()) || !garage.getId().equals(v.getGarageId()))
                        .activeStay(Boolean.TRUE.equals(mov.getActiveStay()))
                        .stayDurationMinutes(durationMin)
                        .stayDurationFormatted(GarageMovementDTO.formatDuration(durationMin))
                        .reason(mov.getReason())
                        .reasonDetail(mov.getReasonDetail())
                        .build());
            }
        }

        dto.setVehicleCount((long) summaries.size());
        dto.setVehicles(summaries);
        dto.setStatusBreakdown(summaries.stream()
                .filter(s -> s.getStatus() != null)
                .collect(java.util.stream.Collectors.groupingBy(
                        VehicleSummary::getStatus, java.util.stream.Collectors.counting())));
        if (garage.getCapacity() != null && garage.getCapacity() > 0) {
            double rate = Math.min(100.0,
                    Math.round(summaries.size() * 1000.0 / garage.getCapacity()) / 10.0);
            dto.setOccupancyRate(rate);
            dto.setAtCapacity(summaries.size() >= garage.getCapacity());
            dto.setNearCapacity(rate >= 90.0);
        }
        return dto;
    }
}
