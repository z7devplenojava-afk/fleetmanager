package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.FleetWorkOrderDTO;
import com.z7design.fleet_manager.dto.WorkOrderItemDTO;
import com.z7design.fleet_manager.model.FleetWorkOrder;
import com.z7design.fleet_manager.model.MaintenancePlan;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.WorkOrderItem;
import com.z7design.fleet_manager.repository.FleetWorkOrderRepository;
import com.z7design.fleet_manager.repository.MaintenancePlanRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FleetWorkOrderService {

    private final FleetWorkOrderRepository repository;
    private final VehicleRepository vehicleRepository;
    private final MaintenancePlanRepository planRepository;
    private final MaintenancePlanService planService;
    private final ProductService productService;

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
                .orElseThrow(() -> new ResourceNotFoundException("FleetWorkOrder not found with id: " + id));
    }

    @Transactional
    public FleetWorkOrderDTO create(FleetWorkOrderDTO dto) {
        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + dto.getVehicleId()));

        MaintenancePlan plan = null;
        if (dto.getPlanId() != null) {
            plan = planRepository.findById(dto.getPlanId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "MaintenancePlan not found with id: " + dto.getPlanId()));
        }

        UUID companyId = TenantContext.get();
        if (companyId == null && vehicle.getCompanyId() != null) {
            companyId = vehicle.getCompanyId();
        }

        FleetWorkOrder entity = FleetWorkOrder.builder()
                .vehicle(vehicle)
                .plan(plan)
                .status(dto.getStatus() != null ? dto.getStatus() : FleetWorkOrder.WorkOrderStatus.DRAFT)
                .priority(dto.getPriority() != null ? dto.getPriority() : FleetWorkOrder.WorkOrderPriority.MEDIUM)
                .mechanicId(dto.getMechanicId())
                .laborType(dto.getLaborType())
                .plannedDate(dto.getPlannedDate())
                .totalCost(BigDecimal.ZERO)
                .notes(dto.getNotes())
                .photoAttachments(dto.getPhotoAttachments())
                .companyId(companyId)
                .build();

        if (dto.getItems() != null) {
            for (WorkOrderItemDTO itemDto : dto.getItems()) {
                addItemToEntity(entity, itemDto);
            }
        }

        return FleetWorkOrderDTO.fromEntity(repository.save(entity));
    }

    @Transactional
    public FleetWorkOrderDTO updateStatus(UUID id, FleetWorkOrder.WorkOrderStatus newStatus) {
        FleetWorkOrder entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FleetWorkOrder not found with id: " + id));

        FleetWorkOrder.WorkOrderStatus oldStatus = entity.getStatus();
        entity.setStatus(newStatus);

        if (newStatus == FleetWorkOrder.WorkOrderStatus.IN_PROGRESS
                && oldStatus != FleetWorkOrder.WorkOrderStatus.IN_PROGRESS) {
            entity.setStartDate(LocalDateTime.now());
        }

        if (newStatus == FleetWorkOrder.WorkOrderStatus.COMPLETED
                && oldStatus != FleetWorkOrder.WorkOrderStatus.COMPLETED) {
            entity.setCompletionDate(LocalDateTime.now());
            // Se estiver vinculada a um plano, marca como executado
            if (entity.getPlan() != null && entity.getVehicle().getCurrentMileage() != null) {
                planService.markAsExecuted(
                        entity.getPlan().getId(),
                        entity.getVehicle().getCurrentMileage(),
                        entity.getCompletionDate().toLocalDate());
            }
        }

        return FleetWorkOrderDTO.fromEntity(repository.save(entity));
    }

    private void addItemToEntity(FleetWorkOrder workOrder, WorkOrderItemDTO itemDto) {
        WorkOrderItem.ItemType itemType = itemDto.getType() != null
                ? itemDto.getType()
                : WorkOrderItem.ItemType.PART;

        BigDecimal totalItemPrice = itemDto.getUnitPrice().multiply(itemDto.getQuantity());

        // Consumir estoque se for um produto
        if (itemDto.getProductId() != null) {
            boolean lowStock = productService.consumeStock(itemDto.getProductId(), itemDto.getQuantity());
            if (lowStock) {
                // Poderíamos adicionar um aviso ao DTO de resposta aqui futuramente
            }
        }

        WorkOrderItem item = WorkOrderItem.builder()
                .workOrder(workOrder)
                .description(itemDto.getDescription())
                .type(itemType)
                .quantity(itemDto.getQuantity())
                .unitPrice(itemDto.getUnitPrice())
                .totalPrice(totalItemPrice)
                .productId(itemDto.getProductId())
                .provider(itemDto.getProvider())
                .build();

        workOrder.getItems().add(item);
        workOrder.setTotalCost(workOrder.getTotalCost().add(totalItemPrice));
    }

    @Transactional
    public void delete(UUID id) {
        repository.deleteById(id);
    }
}
