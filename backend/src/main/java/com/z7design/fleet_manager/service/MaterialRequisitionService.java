package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.procurement.ConfirmDeliveryRequestDTO;
import com.z7design.fleet_manager.dto.procurement.CreateRequisitionRequestDTO;
import com.z7design.fleet_manager.dto.procurement.MaterialRequisitionDTO;
import com.z7design.fleet_manager.dto.procurement.StockItemAvailabilityDTO;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.model.enums.MovementReason;
import com.z7design.fleet_manager.model.enums.MovementType;
import com.z7design.fleet_manager.repository.*;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaterialRequisitionService {

    private final MaterialRequisitionRepository requisitionRepository;
    private final StockReservationRepository stockReservationRepository;
    private final StockItemRepository stockItemRepository;
    private final StockMovementRepository stockMovementRepository;
    private final FleetWorkOrderRepository workOrderRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    private User resolveCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null) {
            return userRepository.findByUsername(auth.getName()).orElse(null);
        }
        return null;
    }

    @Transactional(readOnly = true)
    public StockItemAvailabilityDTO checkStockItemAvailability(UUID stockItemId, UUID excludeWorkOrderId) {
        StockItem stockItem = stockItemRepository.findById(stockItemId)
                .orElseThrow(() -> new IllegalArgumentException("Item de estoque não encontrado com ID: " + stockItemId));

        BigDecimal totalPhysical = BigDecimal.valueOf(stockItem.getCurrentQuantity() != null ? stockItem.getCurrentQuantity() : 0);
        BigDecimal totalReserved = stockReservationRepository.sumReservedQuantityForStockItem(stockItemId);
        if (totalReserved == null) totalReserved = BigDecimal.ZERO;

        BigDecimal freeQuantity = totalPhysical.subtract(totalReserved);
        if (freeQuantity.compareTo(BigDecimal.ZERO) < 0) freeQuantity = BigDecimal.ZERO;

        List<StockReservation> conflicts = stockReservationRepository.findConflictingReservations(stockItemId, excludeWorkOrderId);

        List<StockItemAvailabilityDTO.ReservationConflictDetailDTO> conflictDTOs = conflicts.stream().map(res -> {
            String woNumber = res.getWorkOrder() != null ? res.getWorkOrder().getOsNumber() : "OS-" + res.getWorkOrderId().toString().substring(0, 8);
            String plate = res.getVehicle() != null ? res.getVehicle().getPlate() : (res.getWorkOrder() != null && res.getWorkOrder().getVehicle() != null ? res.getWorkOrder().getVehicle().getPlate() : "N/D");
            String model = res.getVehicle() != null ? res.getVehicle().getModel() : (res.getWorkOrder() != null && res.getWorkOrder().getVehicle() != null ? res.getWorkOrder().getVehicle().getModel() : "");

            return StockItemAvailabilityDTO.ReservationConflictDetailDTO.builder()
                    .reservationId(res.getId())
                    .workOrderId(res.getWorkOrderId())
                    .workOrderNumber(woNumber)
                    .vehicleId(res.getVehicleId())
                    .vehiclePlate(plate)
                    .vehicleModel(model)
                    .quantityReserved(res.getQuantityReserved())
                    .status(res.getStatus().name())
                    .build();
        }).collect(Collectors.toList());

        boolean hasConflict = !conflicts.isEmpty();
        boolean isAvailable = freeQuantity.compareTo(BigDecimal.ZERO) > 0;

        return StockItemAvailabilityDTO.builder()
                .stockItemId(stockItem.getId())
                .itemName(stockItem.getName())
                .itemCode(stockItem.getCode())
                .currentQuantity(totalPhysical)
                .reservedQuantity(totalReserved)
                .availableFreeQuantity(freeQuantity)
                .isAvailable(isAvailable)
                .hasConflict(hasConflict)
                .activeReservations(conflictDTOs)
                .build();
    }

    @Transactional
    public MaterialRequisitionDTO createRequisition(CreateRequisitionRequestDTO dto) {
        UUID companyId = TenantContext.get();
        if (companyId == null) {
            throw new IllegalStateException("Empresa não selecionada no contexto do usuário.");
        }

        User currentUser = resolveCurrentUser();
        String reqNumber = "REQ-" + System.currentTimeMillis() % 1000000;

        // Validar OS e Veículo
        FleetWorkOrder workOrder = null;
        Vehicle vehicle = null;
        if (dto.getWorkOrderId() != null) {
            workOrder = workOrderRepository.findById(dto.getWorkOrderId()).orElse(null);
            if (workOrder != null && workOrder.getVehicle() != null) {
                vehicle = workOrder.getVehicle();
            }
        }
        if (vehicle == null && dto.getVehicleId() != null) {
            vehicle = vehicleRepository.findById(dto.getVehicleId()).orElse(null);
        }

        StockItem stockItem = null;
        if (dto.getStockItemId() != null) {
            stockItem = stockItemRepository.findById(dto.getStockItemId()).orElse(null);
        }

        // Definir meta de SLA com base na urgência
        long slaTargetMinutes = (dto.getUrgency() == MaterialRequisition.UrgencyLevel.EMERGENCIA) ? 240L : 4320L; // 4h para Emergência, 72h para Normal

        String originDept = (dto.getOriginDepartment() != null && !dto.getOriginDepartment().trim().isEmpty())
                ? dto.getOriginDepartment().trim().toUpperCase()
                : "OPERATIONAL";

        MaterialRequisition requisition = MaterialRequisition.builder()
                .companyId(companyId)
                .requisitionNumber(reqNumber)
                .workOrderId(dto.getWorkOrderId())
                .vehicleId(vehicle != null ? vehicle.getId() : null)
                .stockItemId(stockItem != null ? stockItem.getId() : null)
                .itemName(dto.getItemName())
                .itemCode(dto.getItemCode() != null ? dto.getItemCode() : (stockItem != null ? stockItem.getCode() : null))
                .quantity(dto.getQuantity() != null ? dto.getQuantity() : BigDecimal.ONE)
                .unit(dto.getUnit() != null ? dto.getUnit() : "UN")
                .urgency(dto.getUrgency())
                .justification(dto.getJustification())
                .requesterId(currentUser != null ? currentUser.getId() : null)
                .requesterName(currentUser != null ? currentUser.getName() : "Sistema")
                .originDepartment(originDept)
                .status(MaterialRequisition.RequisitionStatus.PENDING_CHECK)
                .slaTargetMinutes(slaTargetMinutes)
                .build();

        requisition = requisitionRepository.save(requisition);

        // Se a OS estiver aberta, atualizar status da OS para WAITING_PARTS
        if (workOrder != null && workOrder.getStatus() != FleetWorkOrder.WorkOrderStatus.COMPLETED) {
            workOrder.setStatus(FleetWorkOrder.WorkOrderStatus.WAITING_PARTS);
            workOrderRepository.save(workOrder);
        }

        return toDTO(requisition);
    }

    @Transactional
    public MaterialRequisitionDTO updateRequisition(UUID id, com.z7design.fleet_manager.dto.procurement.UpdateRequisitionRequestDTO dto) {
        MaterialRequisition req = requisitionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Requisição não encontrada com ID: " + id));

        // Regra de Negócio: Apenas requisições pendentes podem ser editadas
        if (req.getStatus() != MaterialRequisition.RequisitionStatus.PENDING_CHECK &&
            req.getStatus() != MaterialRequisition.RequisitionStatus.WAITING_QUOTES) {
            throw new IllegalStateException("Apenas requisições pendentes podem ser editadas. Status atual: " + req.getStatus());
        }

        req.setItemName(dto.getItemName());
        if (dto.getItemCode() != null) req.setItemCode(dto.getItemCode());
        if (dto.getQuantity() != null) req.setQuantity(dto.getQuantity());
        if (dto.getUnit() != null) req.setUnit(dto.getUnit());
        if (dto.getUrgency() != null) req.setUrgency(dto.getUrgency());
        if (dto.getJustification() != null) req.setJustification(dto.getJustification());
        if (dto.getWorkOrderId() != null) req.setWorkOrderId(dto.getWorkOrderId());
        if (dto.getStockItemId() != null) req.setStockItemId(dto.getStockItemId());
        if (dto.getOriginDepartment() != null && !dto.getOriginDepartment().trim().isEmpty()) {
            req.setOriginDepartment(dto.getOriginDepartment().trim().toUpperCase());
        }

        req = requisitionRepository.save(req);
        return toDTO(req);
    }

    @Transactional
    public void deleteRequisition(UUID id) {
        MaterialRequisition req = requisitionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Requisição não encontrada com ID: " + id));

        // Regra de Negócio: Apenas requisições pendentes podem ser excluídas
        if (req.getStatus() != MaterialRequisition.RequisitionStatus.PENDING_CHECK &&
            req.getStatus() != MaterialRequisition.RequisitionStatus.WAITING_QUOTES) {
            throw new IllegalStateException("Apenas requisições pendentes podem ser excluídas. Esta requisição está em status '" + req.getStatus() + "'.");
        }

        requisitionRepository.delete(req);
        log.info("🗑️ Requisição de Almoxarifado {} excluída com sucesso", id);
    }

    @Transactional
    public java.util.Map<String, Object> bulkDeleteRequisitions(List<UUID> ids) {
        int deleted = 0;
        int skippedNonPending = 0;
        List<String> skippedReasons = new ArrayList<>();

        for (UUID id : ids) {
            try {
                MaterialRequisition req = requisitionRepository.findById(id).orElse(null);
                if (req == null) continue;

                if (req.getStatus() == MaterialRequisition.RequisitionStatus.PENDING_CHECK ||
                    req.getStatus() == MaterialRequisition.RequisitionStatus.WAITING_QUOTES) {
                    requisitionRepository.delete(req);
                    deleted++;
                } else {
                    skippedNonPending++;
                    skippedReasons.add("Requisição #" + req.getRequisitionNumber() + " ignorada pois está com status " + req.getStatus());
                }
            } catch (Exception e) {
                log.warn("Erro ao tentar excluir requisição {}", id, e);
            }
        }

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("requested", ids.size());
        result.put("deleted", deleted);
        result.put("skippedNonPending", skippedNonPending);
        result.put("messages", skippedReasons);
        return result;
    }

    @Transactional
    public MaterialRequisitionDTO approveByAlmoxarifado(UUID id, String notes) {
        MaterialRequisition req = requisitionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Requisição não encontrada com ID: " + id));

        User currentUser = resolveCurrentUser();
        req.setManagerApprovalId(currentUser != null ? currentUser.getId() : null);
        req.setManagerApprovalName(currentUser != null ? currentUser.getName() : "Almoxarifado");
        req.setManagerApprovalDate(LocalDateTime.now());

        // Se o item estiver em estoque, reserva
        if (req.getStockItemId() != null) {
            try {
                StockItemAvailabilityDTO avail = checkStockItemAvailability(req.getStockItemId(), req.getWorkOrderId());
                if (avail.getAvailableFreeQuantity().compareTo(req.getQuantity()) >= 0) {
                    req.setStatus(MaterialRequisition.RequisitionStatus.RESERVED_STOCK);
                } else {
                    req.setStatus(MaterialRequisition.RequisitionStatus.WAITING_QUOTES);
                }
            } catch (Exception e) {
                req.setStatus(MaterialRequisition.RequisitionStatus.WAITING_QUOTES);
            }
        } else {
            req.setStatus(MaterialRequisition.RequisitionStatus.WAITING_QUOTES);
        }

        req = requisitionRepository.save(req);
        return toDTO(req);
    }

    @Transactional
    public MaterialRequisitionDTO rejectByAlmoxarifado(UUID id, String reason) {
        MaterialRequisition req = requisitionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Requisição não encontrada com ID: " + id));

        User currentUser = resolveCurrentUser();
        req.setStatus(MaterialRequisition.RequisitionStatus.REJECTED);
        req.setRejectionReason(reason);
        req.setManagerApprovalName(currentUser != null ? currentUser.getName() : "Almoxarifado");
        req.setManagerApprovalDate(LocalDateTime.now());

        req = requisitionRepository.save(req);
        return toDTO(req);
    }

    @Transactional
    public StockReservation reserveStockForWorkOrder(UUID workOrderId, UUID stockItemId, BigDecimal quantity, String notes) {
        UUID companyId = TenantContext.get();
        FleetWorkOrder workOrder = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new IllegalArgumentException("OS não encontrada"));
        StockItem stockItem = stockItemRepository.findById(stockItemId)
                .orElseThrow(() -> new IllegalArgumentException("Item de estoque não encontrado"));

        StockItemAvailabilityDTO avail = checkStockItemAvailability(stockItemId, workOrderId);
        if (avail.getAvailableFreeQuantity().compareTo(quantity) < 0) {
            throw new IllegalStateException("Saldo livre insuficiente para reserva imediata. Disponível: " + avail.getAvailableFreeQuantity());
        }

        User currentUser = resolveCurrentUser();

        StockReservation reservation = StockReservation.builder()
                .companyId(companyId != null ? companyId : workOrder.getCompanyId())
                .stockItemId(stockItemId)
                .workOrderId(workOrderId)
                .vehicleId(workOrder.getVehicle() != null ? workOrder.getVehicle().getId() : null)
                .quantityReserved(quantity)
                .status(StockReservation.ReservationStatus.READY_FOR_INSTALLATION)
                .reservedById(currentUser != null ? currentUser.getId() : null)
                .reservedByName(currentUser != null ? currentUser.getName() : "Almoxarifado")
                .reservedAt(LocalDateTime.now())
                .notes(notes)
                .build();

        return stockReservationRepository.save(reservation);
    }

    @Transactional
    public void completeWorkOrderStockDeduction(UUID workOrderId) {
        List<StockReservation> reservations = stockReservationRepository.findByWorkOrderId(workOrderId);
        for (StockReservation res : reservations) {
            if (res.getStatus() == StockReservation.ReservationStatus.ACTIVE_RESERVED ||
                res.getStatus() == StockReservation.ReservationStatus.READY_FOR_INSTALLATION) {
                
                // Dar baixa física no estoque
                StockItem item = stockItemRepository.findById(res.getStockItemId()).orElse(null);
                if (item != null) {
                    int current = item.getCurrentQuantity() != null ? item.getCurrentQuantity() : 0;
                    int toDeduct = res.getQuantityReserved().intValue();
                    item.setCurrentQuantity(Math.max(0, current - toDeduct));
                    stockItemRepository.save(item);
                }

                res.setStatus(StockReservation.ReservationStatus.CONSUMED);
                res.setConsumedAt(LocalDateTime.now());
                stockReservationRepository.save(res);

                // Se houver requisição vinculada, atualizar status
                if (res.getRequisitionId() != null) {
                    requisitionRepository.findById(res.getRequisitionId()).ifPresent(req -> {
                        req.setStatus(MaterialRequisition.RequisitionStatus.INSTALLED_COMPLETED);
                        requisitionRepository.save(req);
                    });
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public List<MaterialRequisitionDTO> listRequisitions(MaterialRequisition.RequisitionStatus status) {
        UUID companyId = TenantContext.get();
        List<MaterialRequisition> list = (status != null && companyId != null)
                ? requisitionRepository.findByCompanyIdAndStatusOrderByCreatedAtDesc(companyId, status)
                : (companyId != null ? requisitionRepository.findByCompanyIdOrderByCreatedAtDesc(companyId) : requisitionRepository.findAll());

        return list.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MaterialRequisitionDTO getRequisitionById(UUID id) {
        MaterialRequisition req = requisitionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Requisição não encontrada com ID: " + id));
        return toDTO(req);
    }

    @Transactional
    public MaterialRequisitionDTO confirmDeliveryAndDeductStock(UUID requisitionId, ConfirmDeliveryRequestDTO dto) {
        MaterialRequisition req = requisitionRepository.findById(requisitionId)
                .orElseThrow(() -> new IllegalArgumentException("Requisição não encontrada com ID: " + requisitionId));

        if (req.getStatus() == MaterialRequisition.RequisitionStatus.INSTALLED_COMPLETED) {
            throw new IllegalStateException("Esta requisição já foi entregue e baixada do estoque.");
        }

        User currentUser = resolveCurrentUser();
        LocalDateTime deliveryDate = (dto != null && dto.getDeliveryDate() != null) ? dto.getDeliveryDate() : LocalDateTime.now();
        String receivedBy = (dto != null && dto.getReceivedByName() != null && !dto.getReceivedByName().trim().isEmpty())
                ? dto.getReceivedByName()
                : (req.getRequesterName() != null ? req.getRequesterName() : "Mecânico / Solicitante");
        String notes = (dto != null) ? dto.getNotes() : null;

        // Tentar localizar o StockItem associado
        StockItem stockItem = null;
        if (req.getStockItemId() != null) {
            stockItem = stockItemRepository.findById(req.getStockItemId()).orElse(null);
        }
        if (stockItem == null && req.getItemCode() != null && !req.getItemCode().trim().isEmpty()) {
            stockItem = stockItemRepository.findByCode(req.getItemCode()).orElse(null);
        }
        if (stockItem == null && req.getItemName() != null) {
            List<StockItem> items = stockItemRepository.findByNameContainingIgnoreCase(req.getItemName());
            if (!items.isEmpty()) {
                stockItem = items.get(0);
            }
        }

        // Se encontrou o item no estoque, dar baixa física e registrar movimentação
        if (stockItem != null) {
            int previousQty = stockItem.getCurrentQuantity() != null ? stockItem.getCurrentQuantity() : 0;
            int qtyToDeduct = req.getQuantity() != null ? req.getQuantity().intValue() : 1;
            int newQty = Math.max(0, previousQty - qtyToDeduct);

            stockItem.setCurrentQuantity(newQty);
            stockItemRepository.save(stockItem);

            // Criar movimentação de saída do estoque
            StockMovement movement = new StockMovement();
            movement.setStockItem(stockItem);
            movement.setMovementType(MovementType.SAIDA);
            movement.setReason(MovementReason.REPOSICAO);
            movement.setQuantity(qtyToDeduct);
            movement.setPreviousQuantity(previousQty);
            movement.setNewQuantity(newQty);
            movement.setEmployeeName(receivedBy);
            movement.setUserName(currentUser != null ? currentUser.getName() : "Almoxarifado");
            movement.setDocumentNumber(req.getRequisitionNumber());
            movement.setMovementDate(deliveryDate);

            String woDesc = "";
            if (req.getWorkOrder() != null && req.getWorkOrder().getOsNumber() != null) {
                woDesc = " | OS #" + req.getWorkOrder().getOsNumber();
            } else if (req.getWorkOrderId() != null) {
                woDesc = " | OS Ref: " + req.getWorkOrderId();
            }
            String plateDesc = "";
            if (req.getVehicle() != null && req.getVehicle().getPlate() != null) {
                plateDesc = " | Veículo: " + req.getVehicle().getPlate();
            }

            movement.setNotes("Baixa automática por entrega de Requisição #" + req.getRequisitionNumber() + woDesc + plateDesc + (notes != null ? " | Obs: " + notes : ""));
            stockMovementRepository.save(movement);
        }

        // Atualizar reservas de estoque vinculadas
        if (req.getWorkOrderId() != null) {
            List<StockReservation> reservations = stockReservationRepository.findByWorkOrderId(req.getWorkOrderId());
            for (StockReservation res : reservations) {
                if (res.getStatus() == StockReservation.ReservationStatus.ACTIVE_RESERVED ||
                    res.getStatus() == StockReservation.ReservationStatus.READY_FOR_INSTALLATION) {
                    res.setStatus(StockReservation.ReservationStatus.CONSUMED);
                    res.setConsumedAt(deliveryDate);
                    stockReservationRepository.save(res);
                }
            }
        }

        // Atualizar a requisição
        req.setDeliveryDate(deliveryDate);
        req.setDeliveredAt(deliveryDate);
        req.setDeliveredByName(currentUser != null ? currentUser.getName() : "Almoxarifado");
        req.setDeliveredById(currentUser != null ? currentUser.getId() : null);
        req.setReceivedByName(receivedBy);
        req.setDeliveryNotes(notes);
        req.setStatus(MaterialRequisition.RequisitionStatus.INSTALLED_COMPLETED);
        req.setReleasedAt(deliveryDate);

        req = requisitionRepository.save(req);

        return toDTO(req);
    }

    public MaterialRequisitionDTO toDTO(MaterialRequisition r) {
        String woNum = r.getWorkOrder() != null ? r.getWorkOrder().getOsNumber() : (r.getWorkOrderId() != null ? "OS-" + r.getWorkOrderId().toString().substring(0, 8) : null);
        String plate = r.getVehicle() != null ? r.getVehicle().getPlate() : (r.getWorkOrder() != null && r.getWorkOrder().getVehicle() != null ? r.getWorkOrder().getVehicle().getPlate() : null);
        String model = r.getVehicle() != null ? r.getVehicle().getModel() : (r.getWorkOrder() != null && r.getWorkOrder().getVehicle() != null ? r.getWorkOrder().getVehicle().getModel() : null);

        Long currentSlaMinutes = null;
        if (r.getCreatedAt() != null) {
            LocalDateTime end = (r.getReleasedAt() != null) ? r.getReleasedAt() : LocalDateTime.now();
            currentSlaMinutes = ChronoUnit.MINUTES.between(r.getCreatedAt(), end);
        }

        boolean isBreached = false;
        if (currentSlaMinutes != null && r.getSlaTargetMinutes() != null && currentSlaMinutes > r.getSlaTargetMinutes()) {
            isBreached = true;
        }

        return MaterialRequisitionDTO.builder()
                .id(r.getId())
                .companyId(r.getCompanyId())
                .requisitionNumber(r.getRequisitionNumber())
                .workOrderId(r.getWorkOrderId())
                .workOrderNumber(woNum)
                .vehicleId(r.getVehicleId())
                .vehiclePlate(plate)
                .vehicleModel(model)
                .stockItemId(r.getStockItemId())
                .itemName(r.getItemName())
                .itemCode(r.getItemCode())
                .quantity(r.getQuantity())
                .unit(r.getUnit())
                .urgency(r.getUrgency())
                .justification(r.getJustification())
                .requesterId(r.getRequesterId())
                .requesterName(r.getRequesterName())
                .originDepartment(r.getOriginDepartment())
                .status(r.getStatus())
                .statusDescription(getStatusDescription(r.getStatus()))
                .managerApprovalId(r.getManagerApprovalId())
                .managerApprovalName(r.getManagerApprovalName())
                .managerApprovalDate(r.getManagerApprovalDate())
                .rejectionReason(r.getRejectionReason())
                .releasedAt(r.getReleasedAt())
                .slaLeadTimeMinutes(currentSlaMinutes)
                .slaTargetMinutes(r.getSlaTargetMinutes())
                .isSlaBreached(isBreached)
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .deliveryDate(r.getDeliveryDate())
                .deliveredAt(r.getDeliveredAt())
                .deliveredById(r.getDeliveredById())
                .deliveredByName(r.getDeliveredByName())
                .receivedByName(r.getReceivedByName())
                .deliveryNotes(r.getDeliveryNotes())
                .build();
    }

    private String getStatusDescription(MaterialRequisition.RequisitionStatus s) {
        if (s == null) return "";
        switch (s) {
            case PENDING_CHECK: return "Aguardando Verificação Almoxarifado";
            case RESERVED_STOCK: return "Reservado do Estoque";
            case WAITING_QUOTES: return "Aguardando 3 Cotações";
            case QUOTES_RECEIVED: return "Cotações Cadastradas (Avaliação)";
            case APPROVED_BY_MANAGER: return "Aprovado p/ Gestor Manutenção";
            case OC_GENERATED: return "Ordem de Compra Emitida (Financeiro)";
            case WAITING_DELIVERY: return "Em Trânsito / Aguardando Entrega";
            case AVAILABLE_FOR_INSTALLATION: return "Liberado p/ Instalação na OS";
            case INSTALLED_COMPLETED: return "Instalado e Baixado do Estoque";
            case REJECTED: return "Rejeitado";
            case CANCELLED: return "Cancelado";
            default: return s.name();
        }
    }
}
