package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.FleetWorkOrderDTO;
import com.z7design.fleet_manager.dto.FleetWorkOrderHistoryDTO;
import com.z7design.fleet_manager.dto.VehicleMaintenanceRankingDTO;
import com.z7design.fleet_manager.dto.WorkOrderItemDTO;
import com.z7design.fleet_manager.model.FleetWorkOrder;
import com.z7design.fleet_manager.model.FleetWorkOrderHistory;
import com.z7design.fleet_manager.model.MaintenancePlan;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.WorkOrderItem;
import com.z7design.fleet_manager.repository.FleetWorkOrderHistoryRepository;
import com.z7design.fleet_manager.repository.FleetWorkOrderRepository;
import com.z7design.fleet_manager.repository.MaintenancePlanRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FleetWorkOrderService {

    private final FleetWorkOrderRepository repository;
    private final FleetWorkOrderHistoryRepository historyRepository;
    private final VehicleRepository vehicleRepository;
    private final MaintenancePlanRepository planRepository;
    private final MaintenancePlanService planService;
    private final ProductService productService;

    // ── Consultas ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<FleetWorkOrderDTO> getAll() {
        return repository.findAll().stream()
                .map(FleetWorkOrderDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FleetWorkOrderDTO getById(UUID id) {
        return repository.findById(id)
                .map(FleetWorkOrderDTO::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("FleetWorkOrder not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<FleetWorkOrderHistoryDTO> getHistory(UUID workOrderId) {
        return historyRepository.findByWorkOrderIdOrderByCreatedAtAsc(workOrderId)
                .stream()
                .map(FleetWorkOrderHistoryDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // ── Criação ───────────────────────────────────────────────────────────────

    @Transactional
    public FleetWorkOrderDTO create(FleetWorkOrderDTO dto) {
        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found: " + dto.getVehicleId()));

        MaintenancePlan plan = null;
        if (dto.getPlanId() != null) {
            plan = planRepository.findById(dto.getPlanId()).orElse(null);
        }

        UUID companyId = TenantContext.get();
        if (companyId == null && vehicle.getCompanyId() != null) {
            companyId = vehicle.getCompanyId();
        }

        // Gera número sequencial simples baseado no timestamp
        String osNumber = dto.getOsNumber() != null ? dto.getOsNumber()
                : "OS-" + String.format("%06d", System.currentTimeMillis() % 1_000_000);

        FleetWorkOrder entity = FleetWorkOrder.builder()
                .osNumber(osNumber)
                .vehicle(vehicle)
                .plan(plan)
                .status(dto.getStatus() != null ? dto.getStatus() : FleetWorkOrder.WorkOrderStatus.DRAFT)
                .priority(dto.getPriority() != null ? dto.getPriority() : FleetWorkOrder.WorkOrderPriority.MEDIUM)
                .mechanicId(dto.getMechanicId())
                .mechanicName(dto.getMechanicName())
                .laborType(dto.getLaborType())
                .plannedDate(dto.getPlannedDate())
                .actualDate(dto.getActualDate())
                .odometerIn(dto.getOdometerIn())
                .odometerOut(dto.getOdometerOut())
                .stopReason(dto.getStopReason())
                .laborCost(nullSafe(dto.getLaborCost()))
                .partsCost(BigDecimal.ZERO)
                .totalCost(BigDecimal.ZERO)
                .notes(dto.getNotes())
                .photoAttachments(dto.getPhotoAttachments() != null ? dto.getPhotoAttachments() : new ArrayList<>())
                .companyId(companyId)
                .build();

        if (dto.getItems() != null) {
            for (WorkOrderItemDTO itemDto : dto.getItems()) {
                addItemToEntity(entity, itemDto);
            }
        }

        // Soma custo de mão de obra ao total
        entity.setTotalCost(entity.getPartsCost().add(entity.getLaborCost()));

        FleetWorkOrder saved = repository.save(entity);

        // Registra histórico de criação
        addHistory(saved.getId(), "CREATED", "Ordem de Serviço criada com status: "
                + saved.getStatus().name(), dto.getMechanicName(), null, saved.getStatus().name());

        return FleetWorkOrderDTO.fromEntity(saved);
    }

    // ── Atualização completa ──────────────────────────────────────────────────

    @Transactional
    public FleetWorkOrderDTO update(UUID id, FleetWorkOrderDTO dto) {
        FleetWorkOrder entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FleetWorkOrder not found: " + id));

        // Veículo pode mudar (edge case: transferência)
        if (dto.getVehicleId() != null && !dto.getVehicleId().equals(
                entity.getVehicle() != null ? entity.getVehicle().getId() : null)) {
            Vehicle newVehicle = vehicleRepository.findById(dto.getVehicleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found: " + dto.getVehicleId()));
            entity.setVehicle(newVehicle);
        }

        if (dto.getPriority() != null) entity.setPriority(dto.getPriority());
        if (dto.getMechanicName() != null) entity.setMechanicName(dto.getMechanicName());
        if (dto.getMechanicId() != null) entity.setMechanicId(dto.getMechanicId());
        if (dto.getLaborType() != null) entity.setLaborType(dto.getLaborType());
        if (dto.getPlannedDate() != null) entity.setPlannedDate(dto.getPlannedDate());
        if (dto.getActualDate() != null) entity.setActualDate(dto.getActualDate());
        if (dto.getOdometerIn() != null) entity.setOdometerIn(dto.getOdometerIn());
        if (dto.getOdometerOut() != null) entity.setOdometerOut(dto.getOdometerOut());
        if (dto.getStopReason() != null) entity.setStopReason(dto.getStopReason());
        if (dto.getNotes() != null) entity.setNotes(dto.getNotes());
        if (dto.getLaborCost() != null) entity.setLaborCost(dto.getLaborCost());
        if (dto.getPhotoAttachments() != null) entity.setPhotoAttachments(dto.getPhotoAttachments());

        // Atualiza itens se fornecidos
        if (dto.getItems() != null) {
            entity.getItems().clear();
            entity.setPartsCost(BigDecimal.ZERO);
            entity.setTotalCost(BigDecimal.ZERO);
            for (WorkOrderItemDTO itemDto : dto.getItems()) {
                addItemToEntity(entity, itemDto);
            }
        }

        entity.setTotalCost(entity.getPartsCost().add(entity.getLaborCost()));

        FleetWorkOrder saved = repository.save(entity);

        addHistory(saved.getId(), "UPDATED", "OS atualizada pelo usuário.",
                dto.getMechanicName(), null, null);

        return FleetWorkOrderDTO.fromEntity(saved);
    }

    // ── Mudança de status ─────────────────────────────────────────────────────

    @Transactional
    public FleetWorkOrderDTO updateStatus(UUID id, FleetWorkOrder.WorkOrderStatus newStatus) {
        FleetWorkOrder entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FleetWorkOrder not found: " + id));

        FleetWorkOrder.WorkOrderStatus oldStatus = entity.getStatus();
        entity.setStatus(newStatus);

        if (newStatus == FleetWorkOrder.WorkOrderStatus.IN_PROGRESS
                && oldStatus != FleetWorkOrder.WorkOrderStatus.IN_PROGRESS) {
            entity.setStartDate(LocalDateTime.now());
        }

        if (newStatus == FleetWorkOrder.WorkOrderStatus.COMPLETED
                && oldStatus != FleetWorkOrder.WorkOrderStatus.COMPLETED) {
            entity.setCompletionDate(LocalDateTime.now());
            if (entity.getPlan() != null && entity.getVehicle().getCurrentMileage() != null) {
                planService.markAsExecuted(
                        entity.getPlan().getId(),
                        entity.getVehicle().getCurrentMileage(),
                        entity.getCompletionDate().toLocalDate());
            }
        }

        FleetWorkOrder saved = repository.save(entity);

        // Histórico da mudança de status
        addHistory(saved.getId(), "STATUS_CHANGE",
                "Status alterado de " + oldStatus.name() + " para " + newStatus.name(),
                null, oldStatus.name(), newStatus.name());

        return FleetWorkOrderDTO.fromEntity(saved);
    }

    // ── Adicionar nota manual ao histórico ────────────────────────────────────

    @Transactional
    public FleetWorkOrderHistoryDTO addNote(UUID workOrderId, String note, String performedBy) {
        if (!repository.existsById(workOrderId)) {
            throw new ResourceNotFoundException("FleetWorkOrder not found: " + workOrderId);
        }
        FleetWorkOrderHistory h = addHistory(workOrderId, "NOTE", note, performedBy, null, null);
        return FleetWorkOrderHistoryDTO.fromEntity(h);
    }

    // ── Ranking de veículos ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<VehicleMaintenanceRankingDTO> getVehicleRanking() {
        List<Object[]> rows = repository.findVehicleRankingRaw();
        List<VehicleMaintenanceRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            UUID vehicleId         = (UUID)   row[0];
            String plate           = (String) row[1];
            String model           = (String) row[2];
            long totalOrders       = ((Number) row[3]).longValue();
            long completedOrders   = ((Number) row[4]).longValue();
            long cancelledOrders   = ((Number) row[5]).longValue();
            BigDecimal totalCost   = row[6] != null ? new BigDecimal(row[6].toString()) : BigDecimal.ZERO;
            long downtimeHours     = row[7] != null ? ((Number) row[7]).longValue() : 0L;

            double completionRate = totalOrders > 0
                    ? BigDecimal.valueOf(completedOrders * 100.0 / totalOrders)
                        .setScale(1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;

            // Recomendação baseada em custo e frequência
            String recommendation;
            if (totalOrders >= 10 || totalCost.compareTo(BigDecimal.valueOf(50_000)) > 0) {
                recommendation = "RETIRE";
            } else if (totalOrders >= 5 || totalCost.compareTo(BigDecimal.valueOf(20_000)) > 0) {
                recommendation = "REVIEW";
            } else {
                recommendation = "KEEP";
            }

            result.add(VehicleMaintenanceRankingDTO.builder()
                    .vehicleId(vehicleId)
                    .vehiclePlate(plate)
                    .vehicleModel(model)
                    .totalOrders(totalOrders)
                    .completedOrders(completedOrders)
                    .cancelledOrders(cancelledOrders)
                    .totalCost(totalCost)
                    .totalDowntimeHours(downtimeHours)
                    .completionRate(completionRate)
                    .recommendation(recommendation)
                    .build());
        }
        return result;
    }

    // ── Exclusão ──────────────────────────────────────────────────────────────

    @Transactional
    public void delete(UUID id) {
        repository.deleteById(id);
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    private void addItemToEntity(FleetWorkOrder workOrder, WorkOrderItemDTO itemDto) {
        WorkOrderItem.ItemType itemType = itemDto.getType() != null
                ? itemDto.getType()
                : WorkOrderItem.ItemType.PART;

        BigDecimal qty   = itemDto.getQuantity() != null ? itemDto.getQuantity() : BigDecimal.ONE;
        BigDecimal price = itemDto.getUnitPrice() != null ? itemDto.getUnitPrice() : BigDecimal.ZERO;
        BigDecimal total = price.multiply(qty);

        if (itemDto.getProductId() != null) {
            productService.consumeStock(itemDto.getProductId(), qty);
        }

        WorkOrderItem item = WorkOrderItem.builder()
                .workOrder(workOrder)
                .description(itemDto.getDescription())
                .type(itemType)
                .quantity(qty)
                .unitPrice(price)
                .totalPrice(total)
                .productId(itemDto.getProductId())
                .provider(itemDto.getProvider())
                .build();

        workOrder.getItems().add(item);
        workOrder.setPartsCost(workOrder.getPartsCost().add(total));
    }

    private FleetWorkOrderHistory addHistory(UUID workOrderId, String actionType,
            String description, String performedBy, String oldValue, String newValue) {
        FleetWorkOrderHistory h = FleetWorkOrderHistory.builder()
                .workOrderId(workOrderId)
                .actionType(actionType)
                .description(description)
                .performedBy(performedBy)
                .oldValue(oldValue)
                .newValue(newValue)
                .build();
        return historyRepository.save(h);
    }

    private BigDecimal nullSafe(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }
}
