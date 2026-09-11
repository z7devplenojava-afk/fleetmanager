package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.FleetWorkOrderDTO;
import com.z7design.fleet_manager.dto.FleetWorkOrderHistoryDTO;
import com.z7design.fleet_manager.dto.PurchaseRequestDTO;
import com.z7design.fleet_manager.dto.PurchaseRequestItemDTO;
import com.z7design.fleet_manager.dto.VehicleMaintenanceRankingDTO;
import com.z7design.fleet_manager.dto.WorkOrderItemDTO;
import com.z7design.fleet_manager.model.FleetWorkOrder;
import com.z7design.fleet_manager.model.FleetWorkOrderHistory;
import com.z7design.fleet_manager.model.MaintenancePlan;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.WorkPost;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.WorkOrderItem;
import com.z7design.fleet_manager.repository.FleetWorkOrderHistoryRepository;
import com.z7design.fleet_manager.repository.FleetWorkOrderRepository;
import com.z7design.fleet_manager.repository.MaintenancePlanRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import com.z7design.fleet_manager.repository.ChecklistItemRepository;
import com.z7design.fleet_manager.repository.WorkPostRepository;
import com.z7design.fleet_manager.repository.FleetWorkOrderChecklistRepository;
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
    private final PurchaseRequestService purchaseRequestService;
    private final ChecklistItemRepository checklistItemRepository;
    private final FleetWorkOrderChecklistRepository checklistRepository;
    private final WorkPostRepository workPostRepository;

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

    @Transactional(readOnly = true)
    public List<com.z7design.fleet_manager.dto.ChecklistItemDTO> getChecklistMasterItems() {
        return checklistItemRepository.findByAtivoTrueOrderByOrdemAsc().stream()
                .map(com.z7design.fleet_manager.dto.ChecklistItemDTO::fromEntity)
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

        // RN08 — Validação de Odômetro (KM)
        if (dto.getOdometerIn() != null && dto.getOdometerIn() < 0) {
            throw new IllegalArgumentException("O KM de parada não pode ser menor que zero.");
        }
        if (dto.getOdometerOut() != null && dto.getOdometerOut() < 0) {
            throw new IllegalArgumentException("O KM de saída não pode ser menor que zero.");
        }

        // ── Alocação: Obra (Cliente) onde o veículo está alocado ─────────────
        // Se a OS não veio com Obra, resolve automaticamente pela alocação atual
        // do veículo (vehicle.workPostId) e deriva o Cliente da Obra.
        WorkPost workPost = null;
        if (dto.getWorkPostId() != null) {
            workPost = workPostRepository.findById(dto.getWorkPostId()).orElse(null);
        } else if (vehicle.getWorkPostId() != null) {
            workPost = workPostRepository.findById(vehicle.getWorkPostId()).orElse(null);
        }
        UUID resolvedClientId = dto.getClientId() != null ? dto.getClientId()
                : (workPost != null && workPost.getClient() != null ? workPost.getClient().getId() : null);

        // RN01 — Número da OS
        String osNumber = dto.getOsNumber();
        if (osNumber == null || osNumber.isBlank()) {
            osNumber = generateOsNumber();
        }

        FleetWorkOrder.MaintenanceType type = dto.getMaintenanceType() != null
                ? dto.getMaintenanceType()
                : FleetWorkOrder.MaintenanceType.CORRETIVA;

        FleetWorkOrder entity = FleetWorkOrder.builder()
                .osNumber(osNumber)
                .maintenanceType(type)
                .vehicle(vehicle)
                .plan(plan)
                .status(dto.getStatus() != null ? dto.getStatus() : FleetWorkOrder.WorkOrderStatus.OPEN)
                .priority(dto.getPriority() != null ? dto.getPriority() : FleetWorkOrder.WorkOrderPriority.MEDIUM)
                .mechanicId(dto.getMechanicId())
                .mechanicName(dto.getMechanicName())
                .laborType(dto.getLaborType())
                .plannedDate(dto.getPlannedDate())
                .actualDate(dto.getActualDate())
                .stopDate(dto.getStopDate() != null ? dto.getStopDate() : java.time.LocalDate.now())
                .stopTime(dto.getStopTime() != null ? dto.getStopTime() : java.time.LocalTime.now().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm")))
                .exitDate(dto.getExitDate())
                .exitTime(dto.getExitTime())
                .aggregateInfo(dto.getAggregateInfo())
                .anomaliesDescription(dto.getAnomaliesDescription())
                .otherDescription(dto.getOtherDescription())
                .maintenancePerformed(dto.getMaintenancePerformed())
                .workPost(workPost)
                .clientId(resolvedClientId)
                .sectorId(dto.getSectorId())
                .requesterId(dto.getRequesterId())
                .responsibleId(dto.getResponsibleId())
                .supervisorId(dto.getSupervisorId())
                .responsibleSignature(dto.getResponsibleSignature())
                .responsibleSignatureDate(dto.getResponsibleSignatureDate())
                .supervisorSignature(dto.getSupervisorSignature())
                .supervisorSignatureDate(dto.getSupervisorSignatureDate())
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

        // RN05 — Auto-carregar Checklist Preventivo se for PREVENTIVA e não informado
        if (type == FleetWorkOrder.MaintenanceType.PREVENTIVA) {
            if (dto.getChecklistItems() != null && !dto.getChecklistItems().isEmpty()) {
                for (com.z7design.fleet_manager.dto.FleetWorkOrderChecklistDTO cDto : dto.getChecklistItems()) {
                    addChecklistItemToEntity(entity, cDto);
                }
            } else {
                List<com.z7design.fleet_manager.model.ChecklistItem> masterItems = checklistItemRepository.findByAtivoTrueOrderByOrdemAsc();
                for (com.z7design.fleet_manager.model.ChecklistItem master : masterItems) {
                    com.z7design.fleet_manager.model.FleetWorkOrderChecklist item = com.z7design.fleet_manager.model.FleetWorkOrderChecklist.builder()
                            .workOrder(entity)
                            .checklistItem(master)
                            .situacao(com.z7design.fleet_manager.model.FleetWorkOrderChecklist.ChecklistStatus.OK)
                            .build();
                    entity.getChecklistItems().add(item);
                }
            }
        }

        // Soma custo de mão de obra ao total
        entity.setTotalCost(entity.getPartsCost().add(entity.getLaborCost()));

        FleetWorkOrder saved = repository.save(entity);

        // Registra histórico de criação
        addHistory(saved.getId(), "CREATED", "Ordem de Serviço (" + saved.getMaintenanceType() + ") criada com status: "
                + saved.getStatus().name(), dto.getMechanicName(), null, saved.getStatus().name());

        return FleetWorkOrderDTO.fromEntity(saved);
    }

    // ── Atualização completa ──────────────────────────────────────────────────

    @Transactional
    public FleetWorkOrderDTO update(UUID id, FleetWorkOrderDTO dto) {
        FleetWorkOrder entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FleetWorkOrder not found: " + id));

        if (dto.getVehicleId() != null && !dto.getVehicleId().equals(
                entity.getVehicle() != null ? entity.getVehicle().getId() : null)) {
            Vehicle newVehicle = vehicleRepository.findById(dto.getVehicleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found: " + dto.getVehicleId()));
            entity.setVehicle(newVehicle);
        }

        if (dto.getMaintenanceType() != null) entity.setMaintenanceType(dto.getMaintenanceType());
        if (dto.getPriority() != null) entity.setPriority(dto.getPriority());
        if (dto.getMechanicName() != null) entity.setMechanicName(dto.getMechanicName());
        if (dto.getMechanicId() != null) entity.setMechanicId(dto.getMechanicId());
        if (dto.getLaborType() != null) entity.setLaborType(dto.getLaborType());
        if (dto.getPlannedDate() != null) entity.setPlannedDate(dto.getPlannedDate());
        if (dto.getActualDate() != null) entity.setActualDate(dto.getActualDate());

        if (dto.getStopDate() != null) entity.setStopDate(dto.getStopDate());
        if (dto.getStopTime() != null) entity.setStopTime(dto.getStopTime());
        if (dto.getExitDate() != null) entity.setExitDate(dto.getExitDate());
        if (dto.getExitTime() != null) entity.setExitTime(dto.getExitTime());
        if (dto.getAggregateInfo() != null) entity.setAggregateInfo(dto.getAggregateInfo());
        if (dto.getAnomaliesDescription() != null) entity.setAnomaliesDescription(dto.getAnomaliesDescription());
        if (dto.getOtherDescription() != null) entity.setOtherDescription(dto.getOtherDescription());
        if (dto.getMaintenancePerformed() != null) entity.setMaintenancePerformed(dto.getMaintenancePerformed());

        // Alocação: Obra (Cliente) — re-resolve a partir do veículo quando alterado
        if (dto.getWorkPostId() != null) {
            entity.setWorkPost(workPostRepository.findById(dto.getWorkPostId()).orElse(null));
            if (entity.getWorkPost() != null && entity.getWorkPost().getClient() != null) {
                entity.setClientId(entity.getWorkPost().getClient().getId());
            }
        } else if (dto.getClientId() != null) {
            entity.setClientId(dto.getClientId());
        } else if (entity.getVehicle() != null && entity.getVehicle().getWorkPostId() != null
                && entity.getWorkPost() == null) {
            entity.setWorkPost(workPostRepository.findById(entity.getVehicle().getWorkPostId()).orElse(null));
            if (entity.getWorkPost() != null && entity.getWorkPost().getClient() != null) {
                entity.setClientId(entity.getWorkPost().getClient().getId());
    }
}
        if (dto.getSectorId() != null) entity.setSectorId(dto.getSectorId());
        if (dto.getRequesterId() != null) entity.setRequesterId(dto.getRequesterId());
        if (dto.getResponsibleId() != null) entity.setResponsibleId(dto.getResponsibleId());
        if (dto.getSupervisorId() != null) entity.setSupervisorId(dto.getSupervisorId());

        if (dto.getResponsibleSignature() != null) {
            entity.setResponsibleSignature(dto.getResponsibleSignature());
            entity.setResponsibleSignatureDate(java.time.LocalDateTime.now());
        }
        if (dto.getSupervisorSignature() != null) {
            entity.setSupervisorSignature(dto.getSupervisorSignature());
            entity.setSupervisorSignatureDate(java.time.LocalDateTime.now());
        }

        if (dto.getOdometerIn() != null) entity.setOdometerIn(dto.getOdometerIn());
        if (dto.getOdometerOut() != null) entity.setOdometerOut(dto.getOdometerOut());
        if (dto.getStopReason() != null) entity.setStopReason(dto.getStopReason());
        if (dto.getNotes() != null) entity.setNotes(dto.getNotes());
        if (dto.getLaborCost() != null) entity.setLaborCost(dto.getLaborCost());
        if (dto.getPhotoAttachments() != null) entity.setPhotoAttachments(dto.getPhotoAttachments());

        // Atualiza itens de peças/serviços
        if (dto.getItems() != null) {
            entity.getItems().clear();
            entity.setPartsCost(BigDecimal.ZERO);
            entity.setTotalCost(BigDecimal.ZERO);
            for (WorkOrderItemDTO itemDto : dto.getItems()) {
                addItemToEntity(entity, itemDto);
            }
        }

        // Atualiza respostas de checklist se fornecidos
        if (dto.getChecklistItems() != null) {
            entity.getChecklistItems().clear();
            for (com.z7design.fleet_manager.dto.FleetWorkOrderChecklistDTO cDto : dto.getChecklistItems()) {
                addChecklistItemToEntity(entity, cDto);
            }
        }

        // Se o status fornecido for COMPLETED, executa validação RN07
        if (dto.getStatus() == FleetWorkOrder.WorkOrderStatus.COMPLETED) {
            validateCompletion(entity);
            if (entity.getExitDate() == null) entity.setExitDate(java.time.LocalDate.now());
            if (entity.getExitTime() == null) entity.setExitTime(java.time.LocalTime.now().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm")));
            if (entity.getCompletionDate() == null) entity.setCompletionDate(java.time.LocalDateTime.now());
        }

        FleetWorkOrder.WorkOrderStatus oldStatus = entity.getStatus();

        if (dto.getStatus() != null) {
            entity.setStatus(dto.getStatus());
        }

        // Ao concluir (1ª vez), sincroniza o veículo e marca o plano como executado
        if (dto.getStatus() == FleetWorkOrder.WorkOrderStatus.COMPLETED
                && oldStatus != FleetWorkOrder.WorkOrderStatus.COMPLETED) {
            syncVehicleOnCompletion(entity);
            if (entity.getPlan() != null && entity.getVehicle().getCurrentMileage() != null) {
                planService.markAsExecuted(
                        entity.getPlan().getId(),
                        entity.getVehicle().getCurrentMileage(),
                        entity.getCompletionDate().toLocalDate());
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

        if (newStatus == FleetWorkOrder.WorkOrderStatus.COMPLETED) {
            validateCompletion(entity);
            if (entity.getExitDate() == null) entity.setExitDate(java.time.LocalDate.now());
            if (entity.getExitTime() == null) entity.setExitTime(java.time.LocalTime.now().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm")));
            if (entity.getCompletionDate() == null) entity.setCompletionDate(java.time.LocalDateTime.now());
        }

        entity.setStatus(newStatus);

        if (newStatus == FleetWorkOrder.WorkOrderStatus.IN_PROGRESS
                && oldStatus != FleetWorkOrder.WorkOrderStatus.IN_PROGRESS) {
            entity.setStartDate(LocalDateTime.now());
        }

        if (newStatus == FleetWorkOrder.WorkOrderStatus.COMPLETED
                && oldStatus != FleetWorkOrder.WorkOrderStatus.COMPLETED) {
            // Sincroniza o veículo ANTES de marcar o plano, para que o plano
            // seja executado com a quilometragem real de saída (odômetro).
            syncVehicleOnCompletion(entity);
            if (entity.getPlan() != null && entity.getVehicle().getCurrentMileage() != null) {
                planService.markAsExecuted(
                        entity.getPlan().getId(),
                        entity.getVehicle().getCurrentMileage(),
                        entity.getCompletionDate().toLocalDate());
            }
        }

        FleetWorkOrder saved = repository.save(entity);

        addHistory(saved.getId(), "STATUS_CHANGE",
                "Status alterado de " + oldStatus.name() + " para " + newStatus.name(),
                null, oldStatus.name(), newStatus.name());

        return FleetWorkOrderDTO.fromEntity(saved);
    }

    // RN07 e RN06 — Validação de Conclusão da OS
    private void validateCompletion(FleetWorkOrder entity) {
        if (entity.getMaintenancePerformed() == null || entity.getMaintenancePerformed().isBlank()) {
            throw new IllegalArgumentException("Para concluir a OS, a descrição da manutenção realizada deve estar preenchida.");
        }
        if (entity.getMaintenanceType() == FleetWorkOrder.MaintenanceType.PREVENTIVA) {
            if (entity.getChecklistItems() == null || entity.getChecklistItems().isEmpty()) {
                throw new IllegalArgumentException("Para concluir uma OS Preventiva, o checklist de inspeção deve ser preenchido.");
            }
            boolean anyUnset = entity.getChecklistItems().stream()
                    .anyMatch(item -> item.getSituacao() == null);
            if (anyUnset) {
                throw new IllegalArgumentException("Para concluir uma OS Preventiva, todos os itens do checklist devem ser respondidos.");
            }
        }
    }

    private void addChecklistItemToEntity(FleetWorkOrder workOrder, com.z7design.fleet_manager.dto.FleetWorkOrderChecklistDTO cDto) {
        if (cDto.getChecklistItemId() == null) return;
        com.z7design.fleet_manager.model.ChecklistItem itemMaster = checklistItemRepository.findById(cDto.getChecklistItemId())
                .orElse(null);
        if (itemMaster == null) return;

        com.z7design.fleet_manager.model.FleetWorkOrderChecklist checklist = com.z7design.fleet_manager.model.FleetWorkOrderChecklist.builder()
                .workOrder(workOrder)
                .checklistItem(itemMaster)
                .situacao(cDto.getSituacao() != null ? cDto.getSituacao() : com.z7design.fleet_manager.model.FleetWorkOrderChecklist.ChecklistStatus.OK)
                .observacao(cDto.getObservacao())
                .reparoRealizado(cDto.getReparoRealizado())
                .build();

        workOrder.getChecklistItems().add(checklist);
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

    // ── Solicitar compra ao almoxarifado ─────────────────────────────────────

    @Transactional
    public PurchaseRequestDTO requestPurchase(UUID workOrderId, User requester) {
        FleetWorkOrder entity = repository.findById(workOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("FleetWorkOrder not found: " + workOrderId));

        // Apenas itens do tipo PEÇA (PART) são enviados para compra
        List<WorkOrderItem> partItems = entity.getItems().stream()
                .filter(i -> i.getType() == WorkOrderItem.ItemType.PART)
                .collect(Collectors.toList());

        if (partItems.isEmpty()) {
            throw new IllegalArgumentException("A O.S. não possui itens de peça (PART) para solicitar compra.");
        }

        String vehicleLabel = entity.getVehicle() != null
                ? entity.getVehicle().getPlate() + (entity.getVehicle().getModel() != null
                        ? " - " + entity.getVehicle().getModel() : "")
                : "Não informado";

        String osLabel = entity.getOsNumber() != null ? entity.getOsNumber() : workOrderId.toString().substring(0, 8);

        List<PurchaseRequestItemDTO> requestItems = partItems.stream().map(item -> {
            PurchaseRequestItemDTO.PurchaseRequestItemDTOBuilder b = PurchaseRequestItemDTO.builder()
                    .itemName(item.getDescription() != null && !item.getDescription().isBlank()
                            ? item.getDescription() : "Peça")
                    .description("Peça da O.S. " + osLabel + " - Veículo: " + vehicleLabel)
                    .specification("O.S. " + osLabel)
                    .quantity(item.getQuantity())
                    .unitPrice(item.getUnitPrice())
                    .totalPrice(item.getTotalPrice())
                    .priority(entity.getPriority() != null ? entity.getPriority().name() : "MEDIUM")
                    .status("PENDING")
                    .urgency(entity.getPriority() == FleetWorkOrder.WorkOrderPriority.URGENT ? "URGENT" : "NORMAL")
                    .productId(item.getProductId());
            return b.build();
        }).collect(Collectors.toList());

        BigDecimal estimatedTotal = partItems.stream()
                .map(WorkOrderItem::getTotalPrice)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        PurchaseRequestDTO dto = PurchaseRequestDTO.builder()
                .title("Compra de peças - O.S. " + osLabel)
                .description("Solicitação de compra gerada pela O.S. " + osLabel
                        + " (Veículo: " + vehicleLabel + "). Itens necessários para execução da manutenção.")
                .priority(entity.getPriority() != null ? entity.getPriority().name() : "MEDIUM")
                .status("PENDING")
                .requesterName(requester != null ? requester.getName() : "Operacional")
                .department("Operacional")
                .justification("Falta de peça para executar a Ordem de Serviço " + osLabel)
                .estimatedTotal(estimatedTotal)
                .urgency(entity.getPriority() == FleetWorkOrder.WorkOrderPriority.URGENT ? "URGENT" : "NORMAL")
                .requiredDate(LocalDateTime.now().plusDays(3))
                .requestDate(LocalDateTime.now())
                .requesterId(requester != null ? requester.getId() : null)
                .items(requestItems)
                .build();

        PurchaseRequestDTO created = purchaseRequestService.createPurchaseRequest(dto);

        // Registra no histórico da O.S.
        addHistory(workOrderId, "NOTE",
                "Solicitação de compra enviada ao almoxarifado (" + created.getRequestNumber() + ").",
                requester != null ? requester.getName() : "Operacional", null, null);

        return created;
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

    // ── Exclusão (soft-delete — RN10) ────────────────────────────────────────

    @Transactional
    public void delete(UUID id) {
        FleetWorkOrder entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FleetWorkOrder not found: " + id));

        // RN10: OS Concluída não pode ser excluída — use Cancelar
        if (entity.getStatus() == FleetWorkOrder.WorkOrderStatus.COMPLETED) {
            throw new IllegalStateException(
                    "Ordem de Serviço concluída não pode ser excluída. Utilize a opção Cancelar se necessário.");
        }

        // Soft-delete: mantém o registro com timestamp de inativação
        entity.setDeletedAt(LocalDateTime.now());
        repository.save(entity);

        addHistory(id, "DELETED", "OS inativada (soft-delete).", null, null, null);
    }

    /**
     * Duplica uma OS existente gerando novo número de OS e status OPEN.
     * Copia todos os campos relevantes exceto datas de conclusão e assinaturas.
     */
    @Transactional
    public FleetWorkOrderDTO duplicate(UUID sourceId) {
        FleetWorkOrder source = repository.findById(sourceId)
                .orElseThrow(() -> new ResourceNotFoundException("FleetWorkOrder not found: " + sourceId));

        String newOsNumber = generateOsNumber();

        FleetWorkOrder copy = FleetWorkOrder.builder()
                .osNumber(newOsNumber)
                .vehicle(source.getVehicle())
                .plan(source.getPlan())
                .maintenanceType(source.getMaintenanceType())
                .status(FleetWorkOrder.WorkOrderStatus.OPEN)
                .priority(source.getPriority())
                .mechanicId(source.getMechanicId())
                .mechanicName(source.getMechanicName())
                .laborType(source.getLaborType())
                .plannedDate(java.time.LocalDate.now())
                .workPost(source.getWorkPost())
                .clientId(source.getClientId())
                .sectorId(source.getSectorId())
                .requesterId(source.getRequesterId())
                .responsibleId(source.getResponsibleId())
                .supervisorId(source.getSupervisorId())
                .aggregateInfo(source.getAggregateInfo())
                .anomaliesDescription(source.getAnomaliesDescription())
                .otherDescription(source.getOtherDescription())
                .stopReason(source.getStopReason())
                .notes("Duplicado da OS " + source.getOsNumber())
                .companyId(source.getCompanyId())
                .build();

        FleetWorkOrder saved = repository.save(copy);

        addHistory(saved.getId(), "CREATED",
                "OS criada por duplicação da " + source.getOsNumber(), null, null, null);

        return FleetWorkOrderDTO.fromEntity(saved);
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    /**
     * Sincroniza o veículo ao concluir a OS: atualiza a quilometragem com o
     * odômetro de saída (apenas se for maior que a atual, evitando retrocedo
     * por lançamento errado) e grava a data da última manutenção.
     */
    private void syncVehicleOnCompletion(FleetWorkOrder entity) {
        Vehicle vehicle = entity.getVehicle();
        if (vehicle == null) return;

        if (entity.getOdometerOut() != null
                && (vehicle.getCurrentMileage() == null
                    || entity.getOdometerOut() > vehicle.getCurrentMileage())) {
            vehicle.setCurrentMileage(entity.getOdometerOut());
        }

        java.time.LocalDate completionDate = entity.getCompletionDate() != null
                ? entity.getCompletionDate().toLocalDate()
                : entity.getExitDate();
        if (completionDate != null) {
            vehicle.setLastMaintenanceDate(completionDate);
        }

        vehicleRepository.save(vehicle);
    }

    /**
     * RN01 — Gera o número sequencial legível da OS, ex: OS-2026-000123.
     */
    private String generateOsNumber() {
        int currentYear = java.time.Year.now().getValue();
        long count = repository.count() + 1;
        return String.format("OS-%d-%06d", currentYear, count);
    }

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
