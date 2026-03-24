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
    private UUID vehicleId;
    private String vehiclePlate;
    private UUID planId;
    private String planTaskName;
    private FleetWorkOrder.WorkOrderStatus status;
    private FleetWorkOrder.WorkOrderPriority priority;
    private UUID mechanicId;
    private FleetWorkOrder.LaborType laborType;
    private LocalDate plannedDate;
    private LocalDateTime startDate;
    private LocalDateTime completionDate;
    private BigDecimal totalCost;
    private String notes;
    private List<WorkOrderItemDTO> items;
    private List<String> photoAttachments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static FleetWorkOrderDTO fromEntity(FleetWorkOrder entity) {
        if (entity == null)
            return null;
        return FleetWorkOrderDTO.builder()
                .id(entity.getId())
                .vehicleId(entity.getVehicle() != null ? entity.getVehicle().getId() : null)
                .vehiclePlate(entity.getVehicle() != null ? entity.getVehicle().getPlate() : null)
                .planId(entity.getPlan() != null ? entity.getPlan().getId() : null)
                .planTaskName(entity.getPlan() != null ? entity.getPlan().getTaskName() : null)
                .status(entity.getStatus())
                .priority(entity.getPriority())
                .mechanicId(entity.getMechanicId())
                .laborType(entity.getLaborType())
                .plannedDate(entity.getPlannedDate())
                .startDate(entity.getStartDate())
                .completionDate(entity.getCompletionDate())
                .totalCost(entity.getTotalCost())
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
