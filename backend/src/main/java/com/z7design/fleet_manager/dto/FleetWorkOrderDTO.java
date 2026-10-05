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
    private FleetWorkOrder.MaintenanceType maintenanceType;
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

    // Campos de Parada e Saída PRD
    private LocalDate stopDate;
    private String stopTime;
    private LocalDate exitDate;
    private String exitTime;
    private String aggregateInfo;

    // Descrições PRD
    private String anomaliesDescription;
    private String otherDescription;
    private String maintenancePerformed;

    // Alocação do veículo — Obra (Cliente) onde o veículo está alocado
    private UUID workPostId;
    private String workPostName;
    private UUID garageId;
    private String garageName;
    private UUID clientId;
    private String clientName;

    // Envolvidos PRD
    private UUID sectorId;
    private UUID requesterId;
    private UUID responsibleId;
    private UUID supervisorId;

    // Assinaturas PRD
    private String responsibleSignature;
    private LocalDateTime responsibleSignatureDate;
    private String supervisorSignature;
    private LocalDateTime supervisorSignatureDate;

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
    private List<FleetWorkOrderChecklistDTO> checklistItems;
    private List<String> photoAttachments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static FleetWorkOrderDTO fromEntity(FleetWorkOrder entity) {
        if (entity == null) return null;

        // Resolve Obra (Cliente) — prioriza a obra gravada na OS; se ausente,
        // cai para a alocação atual do veículo (vehicle.workPostId).
        UUID workPostId = null;
        String workPostName = null;
        UUID clientId = entity.getClientId();
        String clientName = null;

        if (entity.getWorkPost() != null) {
            workPostId = entity.getWorkPost().getId();
            workPostName = entity.getWorkPost().getName();
            if (entity.getWorkPost().getClient() != null) {
                clientId = entity.getWorkPost().getClient().getId();
                clientName = entity.getWorkPost().getClient().getName();
            }
        }
        if (workPostId == null && entity.getVehicle() != null && entity.getVehicle().getWorkPostId() != null) {
            workPostId = entity.getVehicle().getWorkPostId();
            workPostName = entity.getVehicle().getWorkPostEntity() != null
                    ? entity.getVehicle().getWorkPostEntity().getName()
                    : null;
            if (entity.getVehicle().getWorkPostEntity() != null && entity.getVehicle().getWorkPostEntity().getClient() != null) {
                clientId = entity.getVehicle().getWorkPostEntity().getClient().getId();
                clientName = entity.getVehicle().getWorkPostEntity().getClient().getName();
            }
        }
        // Garagem: prioriza a garagem gravada na OS; fallback = garagem atual do veículo.
        UUID garageId = entity.getGarage() != null ? entity.getGarage().getId() : null;
        String garageName = entity.getGarage() != null ? entity.getGarage().getName() : null;
        if (garageId == null && entity.getVehicle() != null) {
            garageId = entity.getVehicle().getGarageId();
            garageName = entity.getVehicle().getGarageName();
            if (garageName == null && entity.getVehicle().getGarage() != null) {
                garageName = entity.getVehicle().getGarage().getName();
                garageId = entity.getVehicle().getGarage().getId();
            }
        }
        if (clientId == null && entity.getVehicle() != null && entity.getVehicle().getClientId() != null) {
            clientId = entity.getVehicle().getClientId();
        }
        if (clientName == null && entity.getVehicle() != null) {
            if (entity.getVehicle().getClientName() != null && !entity.getVehicle().getClientName().isBlank()) {
                clientName = entity.getVehicle().getClientName();
            } else if (entity.getVehicle().getClientEntity() != null) {
                clientName = entity.getVehicle().getClientEntity().getName();
            }
        }

        String mechanicName = entity.getMechanicName();
        if ((mechanicName == null || mechanicName.isBlank()) && entity.getVehicle() != null) {
            if (entity.getVehicle().getResponsibleEmployee() != null) {
                mechanicName = entity.getVehicle().getResponsibleEmployee().getName();
            } else if (entity.getVehicle().getAssignedDriver() != null && !entity.getVehicle().getAssignedDriver().isBlank()) {
                mechanicName = entity.getVehicle().getAssignedDriver();
            }
        }

        java.time.LocalDate stopDate = entity.getStopDate();
        if (stopDate == null) {
            if (entity.getStartDate() != null) {
                stopDate = entity.getStartDate().toLocalDate();
            } else if (entity.getPlannedDate() != null) {
                stopDate = entity.getPlannedDate();
            } else if (entity.getCreatedAt() != null) {
                stopDate = entity.getCreatedAt().toLocalDate();
            }
        }

        Integer odometerIn = entity.getOdometerIn();
        if (odometerIn == null && entity.getVehicle() != null) {
            odometerIn = entity.getVehicle().getCurrentMileage();
        }

        return FleetWorkOrderDTO.builder()
                .id(entity.getId())
                .osNumber(entity.getOsNumber())
                .maintenanceType(entity.getMaintenanceType())
                .vehicleId(entity.getVehicle() != null ? entity.getVehicle().getId() : null)
                .vehiclePlate(entity.getVehicle() != null ? entity.getVehicle().getPlate() : null)
                .vehicleModel(entity.getVehicle() != null ? entity.getVehicle().getModel() : null)
                .planId(entity.getPlan() != null ? entity.getPlan().getId() : null)
                .planTaskName(entity.getPlan() != null ? entity.getPlan().getTaskName() : null)
                .status(entity.getStatus())
                .priority(entity.getPriority())
                .mechanicId(entity.getMechanicId())
                .mechanicName(mechanicName)
                .laborType(entity.getLaborType())
                .plannedDate(entity.getPlannedDate())
                .actualDate(entity.getActualDate())
                .startDate(entity.getStartDate())
                .completionDate(entity.getCompletionDate())
                .stopDate(stopDate)
                .stopTime(entity.getStopTime())
                .exitDate(entity.getExitDate())
                .exitTime(entity.getExitTime())
                .aggregateInfo(entity.getAggregateInfo())
                .anomaliesDescription(entity.getAnomaliesDescription())
                .otherDescription(entity.getOtherDescription())
                .maintenancePerformed(entity.getMaintenancePerformed())
                .workPostId(workPostId)
                .workPostName(workPostName)
                .garageId(garageId)
                .garageName(garageName)
                .clientId(clientId)
                .clientName(clientName)
                .sectorId(entity.getSectorId())
                .requesterId(entity.getRequesterId())
                .responsibleId(entity.getResponsibleId())
                .supervisorId(entity.getSupervisorId())
                .responsibleSignature(entity.getResponsibleSignature())
                .responsibleSignatureDate(entity.getResponsibleSignatureDate())
                .supervisorSignature(entity.getSupervisorSignature())
                .supervisorSignatureDate(entity.getSupervisorSignatureDate())
                .odometerIn(odometerIn)
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
                .checklistItems(entity.getChecklistItems() != null
                        ? entity.getChecklistItems().stream().map(FleetWorkOrderChecklistDTO::fromEntity).collect(Collectors.toList())
                        : null)
                .photoAttachments(entity.getPhotoAttachments() != null
                        ? new java.util.ArrayList<>(entity.getPhotoAttachments())
                        : new java.util.ArrayList<>())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
