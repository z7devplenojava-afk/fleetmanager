package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.PurchaseRequestDTO;
import com.z7design.fleet_manager.dto.PurchaseRequestItemDTO;
import com.z7design.fleet_manager.model.PurchaseRequest;
import com.z7design.fleet_manager.model.PurchaseRequestItem;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.Unit;
import com.z7design.fleet_manager.repository.PurchaseRequestRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.repository.UnitRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PurchaseRequestService {

    private final PurchaseRequestRepository purchaseRequestRepository;
    private final UserRepository userRepository;
    private final UnitRepository unitRepository;
    private final com.z7design.fleet_manager.repository.ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<PurchaseRequestDTO> getAllPurchaseRequests() {
        return purchaseRequestRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<PurchaseRequestDTO> getPurchaseRequestById(UUID id) {
        return purchaseRequestRepository.findById(id)
                .map(this::convertToDTO);
    }

    @Transactional
    public PurchaseRequestDTO createPurchaseRequest(PurchaseRequestDTO requestDTO) {
        PurchaseRequest request = convertToEntity(requestDTO);
        request.setCreatedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());

        // Gerar nÃºmero da requisiÃ§Ã£o
        if (request.getRequestNumber() == null) {
            request.setRequestNumber(generateRequestNumber());
        }

        PurchaseRequest savedRequest = purchaseRequestRepository.save(request);
        return convertToDTO(savedRequest);
    }

    @Transactional
    public PurchaseRequestDTO updatePurchaseRequest(UUID id, PurchaseRequestDTO requestDTO) {
        Optional<PurchaseRequest> existingRequest = purchaseRequestRepository.findById(id);
        if (existingRequest.isPresent()) {
            PurchaseRequest request = existingRequest.get();
            updateRequestFromDTO(request, requestDTO);
            request.setUpdatedAt(LocalDateTime.now());

            PurchaseRequest savedRequest = purchaseRequestRepository.save(request);
            return convertToDTO(savedRequest);
        }
        throw new RuntimeException("RequisiÃ§Ã£o de compra nÃ£o encontrada");
    }

    @Transactional
    public void deletePurchaseRequest(UUID id) {
        purchaseRequestRepository.deleteById(id);
    }

    @Transactional
    public PurchaseRequestDTO approveRequest(UUID id, String approverName, String approvalNotes) {
        Optional<PurchaseRequest> request = purchaseRequestRepository.findById(id);
        if (request.isPresent()) {
            PurchaseRequest purchaseRequest = request.get();
            purchaseRequest.setStatus("APPROVED");
            purchaseRequest.setApprovedBy(approverName);
            purchaseRequest.setApprovalNotes(approvalNotes);
            purchaseRequest.setApprovalDate(LocalDateTime.now());
            purchaseRequest.setUpdatedAt(LocalDateTime.now());

            PurchaseRequest savedRequest = purchaseRequestRepository.save(purchaseRequest);
            return convertToDTO(savedRequest);
        }
        throw new RuntimeException("RequisiÃ§Ã£o de compra nÃ£o encontrada");
    }

    @Transactional
    public PurchaseRequestDTO rejectRequest(UUID id, String rejectorName, String rejectionReason) {
        Optional<PurchaseRequest> request = purchaseRequestRepository.findById(id);
        if (request.isPresent()) {
            PurchaseRequest purchaseRequest = request.get();
            purchaseRequest.setStatus("REJECTED");
            purchaseRequest.setApprovedBy(rejectorName);
            purchaseRequest.setApprovalNotes(rejectionReason);
            purchaseRequest.setUpdatedAt(LocalDateTime.now());

            PurchaseRequest savedRequest = purchaseRequestRepository.save(purchaseRequest);
            return convertToDTO(savedRequest);
        }
        throw new RuntimeException("RequisiÃ§Ã£o de compra nÃ£o encontrada");
    }

    @Transactional
    public PurchaseRequestDTO completeRequest(UUID id) {
        Optional<PurchaseRequest> request = purchaseRequestRepository.findById(id);
        if (request.isPresent()) {
            PurchaseRequest purchaseRequest = request.get();
            purchaseRequest.setStatus("COMPLETED");
            purchaseRequest.setCompletionDate(LocalDateTime.now());
            purchaseRequest.setUpdatedAt(LocalDateTime.now());

            PurchaseRequest savedRequest = purchaseRequestRepository.save(purchaseRequest);
            return convertToDTO(savedRequest);
        }
        throw new RuntimeException("RequisiÃ§Ã£o de compra nÃ£o encontrada");
    }

    @Transactional(readOnly = true)
    public List<PurchaseRequestDTO> getRequestsByStatus(String status) {
        return purchaseRequestRepository.findByStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PurchaseRequestDTO> getRequestsByPriority(String priority) {
        return purchaseRequestRepository.findByPriority(priority).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PurchaseRequestDTO> getRequestsByRequester(UUID requesterId) {
        return purchaseRequestRepository.findByRequesterId(requesterId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PurchaseRequestDTO> getRequestsByApprover(UUID approverId) {
        return purchaseRequestRepository.findByApproverId(approverId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PurchaseRequestDTO> getRequestsByUnit(UUID unitId) {
        return purchaseRequestRepository.findByUnitId(unitId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PurchaseRequestDTO> getOverdueRequests() {
        return purchaseRequestRepository.findOverdueRequests(LocalDateTime.now()).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PurchaseRequestDTO> getUrgentRequests() {
        return purchaseRequestRepository.findUrgentRequests().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PurchaseRequestDTO> getPendingApprovalRequests() {
        return purchaseRequestRepository.findPendingApprovalRequests().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PurchaseRequestDTO> searchRequests(String searchTerm) {
        return purchaseRequestRepository.searchRequests(searchTerm).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getRequestsCountByStatus(String status) {
        return purchaseRequestRepository.countByStatus(status);
    }

    @Transactional(readOnly = true)
    public long getUrgentRequestsCount() {
        return purchaseRequestRepository.countUrgentRequests();
    }

    @Transactional(readOnly = true)
    public long getOverdueRequestsCount() {
        return purchaseRequestRepository.countOverdueRequests(LocalDateTime.now());
    }

    @Transactional
    public void createAutomaticRestockRequest(com.z7design.fleet_manager.model.Product product) {
        // Verificar se já existe solicitação em aberto para este produto (evitar
        // duplicatas)
        // Simplificação: Verifica se existe alguma requisição não concluída/cancelada
        // que contenha este produto (lógica ideal)
        // Por enquanto, vamos verificar se existe uma requisição com o Título padrão
        // recente.
        String standardTitle = "Reposição Automática: " + product.getName();

        boolean existsOpenRequest = purchaseRequestRepository.findByStatus("DRAFT").stream()
                .anyMatch(r -> r.getTitle().equals(standardTitle)); // Lógica simplificada

        if (existsOpenRequest) {
            log.info("Já existe solicitação de reposição para: {}", product.getName());
            return;
        }

        BigDecimal quantityToOrder = product.calculateReorderQuantity();

        PurchaseRequest request = PurchaseRequest.builder()
                .requestNumber(generateRequestNumber())
                .title(standardTitle)
                .description(
                        "Solicitação gerada automaticamente por nível de estoque baixo (Ponto de Pedido atingido).")
                .priority("HIGH") // Automático geralmente é alta prioridade
                .status("DRAFT")
                .requesterName("System (Auto-Restock)")
                .department("Almoxarifado")
                .justification(
                        "Estoque atual: " + product.getCurrentStock() + " (Mínimo: " + product.getMinimumStock() + ")")
                .estimatedTotal(quantityToOrder
                        .multiply(product.getCostPrice() != null ? product.getCostPrice() : BigDecimal.ZERO))
                .urgency("NORMAL")
                .requestDate(LocalDateTime.now())
                .requiredDate(LocalDateTime.now()
                        .plusDays(product.getLeadTime() != null ? product.getLeadTime().longValue() : 7))
                .unit(product.getUnitEntity()) // Mesma unidade do produto
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        purchaseRequestRepository.save(request);
        log.info("Solicitação de reposição automática criada: {} - Produto: {}", request.getRequestNumber(),
                product.getName());
    }

    // Métodos auxiliares
    private String generateRequestNumber() {
        // Formato: REQ-YYYYMMDD-XXXX
        String date = LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
        String random = String.format("%04d", (int) (Math.random() * 10000));
        return "REQ-" + date + "-" + random;
    }

    // MÃ©todos de conversÃ£o
    private PurchaseRequestDTO convertToDTO(PurchaseRequest request) {
        PurchaseRequestDTO dto = PurchaseRequestDTO.builder()
                .id(request.getId())
                .requestNumber(request.getRequestNumber())
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority())
                .status(request.getStatus())
                .requesterName(request.getRequesterName())
                .department(request.getDepartment())
                .justification(request.getJustification())
                .estimatedTotal(request.getEstimatedTotal())
                .urgency(request.getUrgency())
                .requiredDate(request.getRequiredDate())
                .requestDate(request.getRequestDate())
                .approvalDate(request.getApprovalDate())
                .completionDate(request.getCompletionDate())
                .approvedBy(request.getApprovedBy())
                .approvalNotes(request.getApprovalNotes())
                .supplier(request.getSupplier())
                .paymentMethod(request.getPaymentMethod())
                .installments(request.getInstallments())
                .deliveryMethod(request.getDeliveryMethod())
                .deliveryAddress(request.getDeliveryAddress())
                .contactPerson(request.getContactPerson())
                .contactPhone(request.getContactPhone())
                .contactEmail(request.getContactEmail())
                .notes(request.getNotes())
                .unitId(request.getUnit() != null ? request.getUnit().getId() : null)
                .unitName(request.getUnit() != null ? request.getUnit().getName() : null)
                .requesterId(request.getRequester() != null ? request.getRequester().getId() : null)
                .approverId(request.getApprover() != null ? request.getApprover().getId() : null)
                .approverName(request.getApprover() != null ? request.getApprover().getName() : null)
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .build();

        // Campos calculados
        dto.setUrgent(request.isUrgent());
        dto.setCanBeApproved(request.canBeApproved());
        dto.setOverdue(request.isOverdue());
        dto.setDaysUntilRequired(request.getDaysUntilRequired());

        // Itens da solicitaÃ§Ã£o
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            List<PurchaseRequestItemDTO> itemDtos = request.getItems().stream()
                    .map(this::convertItemToDTO)
                    .collect(Collectors.toList());
            dto.setItems(itemDtos);
            dto.setTotalItems(itemDtos.size());
            BigDecimal itemsTotal = itemDtos.stream()
                    .map(PurchaseRequestItemDTO::getTotalPrice)
                    .filter(java.util.Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            dto.setTotalValue(itemsTotal.compareTo(BigDecimal.ZERO) > 0
                    ? itemsTotal
                    : (request.getEstimatedTotal() != null ? request.getEstimatedTotal() : BigDecimal.ZERO));
        } else {
            dto.setTotalValue(request.getEstimatedTotal() != null ? request.getEstimatedTotal() : BigDecimal.ZERO);
            dto.setTotalItems(0);
        }

        return dto;
    }

    private PurchaseRequestItemDTO convertItemToDTO(PurchaseRequestItem item) {
        PurchaseRequestItemDTO dto = PurchaseRequestItemDTO.builder()
                .id(item.getId())
                .purchaseRequestId(item.getPurchaseRequest() != null ? item.getPurchaseRequest().getId() : null)
                .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                .productName(item.getProduct() != null ? item.getProduct().getName() : null)
                .itemName(item.getItemName())
                .description(item.getDescription())
                .specification(item.getSpecification())
                .unit(item.getUnit())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .totalPrice(item.getTotalPrice())
                .brand(item.getBrand())
                .model(item.getModel())
                .supplier(item.getSupplier())
                .priority(item.getPriority())
                .status(item.getStatus())
                .justification(item.getJustification())
                .alternativeSupplier(item.getAlternativeSupplier())
                .notes(item.getNotes())
                .urgency(item.getUrgency())
                .currentStock(item.getCurrentStock())
                .minimumStock(item.getMinimumStock())
                .stockStatus(item.getStockStatus())
                .approvedBy(item.getApprovedBy())
                .approvalNotes(item.getApprovalNotes())
                .rejectedBy(item.getRejectedBy())
                .rejectionReason(item.getRejectionReason())
                .urgent(item.isUrgent())
                .lowStock(item.isLowStock())
                .outOfStock(item.isOutOfStock())
                .build();
        return dto;
    }

    private PurchaseRequest convertToEntity(PurchaseRequestDTO dto) {
        PurchaseRequest request = PurchaseRequest.builder()
                .requestNumber(dto.getRequestNumber())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .priority(dto.getPriority())
                .status(dto.getStatus())
                .requesterName(dto.getRequesterName())
                .department(dto.getDepartment())
                .justification(dto.getJustification())
                .estimatedTotal(dto.getEstimatedTotal())
                .urgency(dto.getUrgency())
                .requiredDate(dto.getRequiredDate())
                .requestDate(dto.getRequestDate())
                .approvalDate(dto.getApprovalDate())
                .completionDate(dto.getCompletionDate())
                .approvedBy(dto.getApprovedBy())
                .approvalNotes(dto.getApprovalNotes())
                .supplier(dto.getSupplier())
                .paymentMethod(dto.getPaymentMethod())
                .installments(dto.getInstallments())
                .deliveryMethod(dto.getDeliveryMethod())
                .deliveryAddress(dto.getDeliveryAddress())
                .contactPerson(dto.getContactPerson())
                .contactPhone(dto.getContactPhone())
                .contactEmail(dto.getContactEmail())
                .notes(dto.getNotes())
                .build();

        if (dto.getUnitId() != null) {
            Optional<Unit> unit = unitRepository.findById(dto.getUnitId());
            unit.ifPresent(request::setUnit);
        }

        if (dto.getRequesterId() != null) {
            Optional<User> requester = userRepository.findById(dto.getRequesterId());
            requester.ifPresent(request::setRequester);
        }

        if (dto.getApproverId() != null) {
            Optional<User> approver = userRepository.findById(dto.getApproverId());
            approver.ifPresent(request::setApprover);
        }

        // Tenant: preenche o company_id a partir do contexto (consistente com os demais módulos)
        if (request.getCompanyId() == null) {
            UUID tenantCompanyId = TenantContext.get();
            if (tenantCompanyId == null && request.getRequester() != null) {
                tenantCompanyId = request.getRequester().getCompanyId();
            }
            request.setCompanyId(tenantCompanyId);
        }

        // Itens
        if (dto.getItems() != null) {
            request.getItems().clear();
            for (PurchaseRequestItemDTO itemDto : dto.getItems()) {
                request.getItems().add(convertItemToEntity(request, itemDto));
            }
        }

        return request;
    }

    private PurchaseRequestItem convertItemToEntity(PurchaseRequest request, PurchaseRequestItemDTO dto) {
        PurchaseRequestItem item = PurchaseRequestItem.builder()
                .purchaseRequest(request)
                .itemName(dto.getItemName())
                .description(dto.getDescription())
                .specification(dto.getSpecification())
                .unit(dto.getUnit())
                .quantity(dto.getQuantity())
                .unitPrice(dto.getUnitPrice())
                .totalPrice(dto.getTotalPrice())
                .brand(dto.getBrand())
                .model(dto.getModel())
                .supplier(dto.getSupplier())
                .priority(dto.getPriority())
                .status(dto.getStatus())
                .justification(dto.getJustification())
                .alternativeSupplier(dto.getAlternativeSupplier())
                .notes(dto.getNotes())
                .urgency(dto.getUrgency())
                .currentStock(dto.getCurrentStock())
                .minimumStock(dto.getMinimumStock())
                .approvedBy(dto.getApprovedBy())
                .approvalNotes(dto.getApprovalNotes())
                .rejectedBy(dto.getRejectedBy())
                .rejectionReason(dto.getRejectionReason())
                .build();

        if (item.getTotalPrice() == null && item.getQuantity() != null && item.getUnitPrice() != null) {
            item.calculateTotalPrice();
        }

        if (dto.getProductId() != null) {
            productRepository.findById(dto.getProductId()).ifPresent(item::setProduct);
        }

        return item;
    }

    private void updateRequestFromDTO(PurchaseRequest request, PurchaseRequestDTO dto) {
        request.setTitle(dto.getTitle());
        request.setDescription(dto.getDescription());
        request.setPriority(dto.getPriority());
        request.setStatus(dto.getStatus());
        request.setRequesterName(dto.getRequesterName());
        request.setDepartment(dto.getDepartment());
        request.setJustification(dto.getJustification());
        request.setEstimatedTotal(dto.getEstimatedTotal());
        request.setUrgency(dto.getUrgency());
        request.setRequiredDate(dto.getRequiredDate());
        request.setApprovedBy(dto.getApprovedBy());
        request.setApprovalNotes(dto.getApprovalNotes());
        request.setSupplier(dto.getSupplier());
        request.setPaymentMethod(dto.getPaymentMethod());
        request.setDeliveryMethod(dto.getDeliveryMethod());
        request.setDeliveryAddress(dto.getDeliveryAddress());
        request.setContactPerson(dto.getContactPerson());
        request.setContactPhone(dto.getContactPhone());
        request.setContactEmail(dto.getContactEmail());
        request.setNotes(dto.getNotes());

        if (dto.getUnitId() != null) {
            Optional<Unit> unit = unitRepository.findById(dto.getUnitId());
            unit.ifPresent(request::setUnit);
        }

        if (dto.getRequesterId() != null) {
            Optional<User> requester = userRepository.findById(dto.getRequesterId());
            requester.ifPresent(request::setRequester);
        }

        if (dto.getApproverId() != null) {
            Optional<User> approver = userRepository.findById(dto.getApproverId());
            approver.ifPresent(request::setApprover);
        }

        // Itens
        if (dto.getItems() != null) {
            request.getItems().clear();
            for (PurchaseRequestItemDTO itemDto : dto.getItems()) {
                request.getItems().add(convertItemToEntity(request, itemDto));
            }
        }
    }
}
