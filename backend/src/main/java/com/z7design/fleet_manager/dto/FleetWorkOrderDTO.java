package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.FleetWorkOrder;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FleetWorkOrderDTO {

    private UUID id;
    private String osNumber;
    private UUID vehicleId;
    private String vehiclePlate;
    private String vehicleModel;
    private UUID planId;
    private String planTaskName;
    private FleetWorkOrder.WorkOrderStatus status;
    private FleetWorkOrder.WorkOrderPriority priority;
    private UUID mechanicId;
    private String mechanicName;
    private FleetWorkOrder.LaborType laborType;
    private LocalDate plannedDate;
    private LocalDate actualDate;
    private LocalDateTime startDate;
    private LocalDateTime completionDate;

    // Odômetro
    private Integer odometerIn;
    private Integer odometerOut;

    // Motivo da parada
    private String stopReason;

    // Custos
    private BigDecimal laborCost;
    private BigDecimal partsCost;
    private BigDecimal totalCost;

    // Downtime calculado
    private Long downtimeHours;
    private Long downtimeDays;

    private String notes;
    private List<WorkOrderItemDTO> items;
    private List<String> photoAttachments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static FleetWorkOrderDTO fromEntity(FleetWorkOrder entity) {
        if (entity == null) return null;
        return FleetWorkOrderDTO.builder()
                .id(entity.getId())
                .osNumber(entity.getOsNumber())
                .vehicleId(entity.getVehicle() != null ? entity.getVehicle().getId() : null)
                .vehiclePlate(entity.getVehicle() != null ? entity.getVehicle().getPlate() : null)
                .vehicleModel(entity.getVehicle() != null ? entity.getVehicle().getModel() : null)
                .planId(entity.getPlan() != null ? entity.getPlan().getId() : null)
                .planTaskName(entity.getPlan() != null ? entity.getPlan().getTaskName() : null)
                .status(entity.getStatus())
                .priority(entity.getPriority())
                .mechanicId(entity.getMechanicId())
                .mechanicName(entity.getMechanicName())
                .laborType(entity.getLaborType())
                .plannedDate(entity.getPlannedDate())
                .actualDate(entity.getActualDate())
                .startDate(entity.getStartDate())
                .completionDate(entity.getCompletionDate())
                .odometerIn(entity.getOdometerIn())
                .odometerOut(entity.getOdometerOut())
                .stopReason(entity.getStopReason())
                .laborCost(entity.getLaborCost())
                .partsCost(entity.getPartsCost())
                .totalCost(entity.getTotalCost())
                .downtimeHours(entity.getDowntimeHours())
                .downtimeDays(entity.getDowntimeDays())
                .notes(entity.getNotes())
                .items(entity.getItems() != null
                        ? entity.getItems().stream().map(WorkOrderItemDTO::fromEntity).collect(Collectors.toList())
                        : null)
                .photoAttachments(entity.getPhotoAttachments())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
