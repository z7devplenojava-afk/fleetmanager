package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.procurement.*;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.repository.*;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProcurementService {

    private final ProcurementQuoteComparisonRepository comparisonRepository;
    private final ProcurementQuoteOptionRepository optionRepository;
    private final ProcurementPurchaseOrderRepository purchaseOrderRepository;
    private final StockInvoiceEntryRepository invoiceEntryRepository;
    private final MaterialRequisitionRepository requisitionRepository;
    private final StockReservationRepository stockReservationRepository;
    private final StockItemRepository stockItemRepository;
    private final FleetWorkOrderRepository workOrderRepository;
    private final UserRepository userRepository;

    private User resolveCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null) {
            return userRepository.findByUsername(auth.getName()).orElse(null);
        }
        return null;
    }

    @Transactional
    public ProcurementQuoteComparisonDTO saveTripleQuotes(SaveTripleQuotesRequestDTO dto) {
        UUID companyId = TenantContext.get();
        MaterialRequisition requisition = requisitionRepository.findById(dto.getRequisitionId())
                .orElseThrow(() -> new IllegalArgumentException("Requisição não encontrada: " + dto.getRequisitionId()));

        ProcurementQuoteComparison comparison = comparisonRepository.findByRequisitionId(dto.getRequisitionId())
                .orElse(null);

        if (comparison == null) {
            String compNum = "COT-" + System.currentTimeMillis() % 1000000;
            comparison = ProcurementQuoteComparison.builder()
                    .companyId(companyId != null ? companyId : requisition.getCompanyId())
                    .requisitionId(requisition.getId())
                    .comparisonNumber(compNum)
                    .status(ProcurementQuoteComparison.ComparisonStatus.READY_FOR_EVALUATION)
                    .build();
            comparison = comparisonRepository.save(comparison);
        } else {
            // Limpar opções antigas caso esteja editando
            optionRepository.deleteAll(comparison.getOptions());
            comparison.getOptions().clear();
        }

        final ProcurementQuoteComparison finalComp = comparison;
        List<ProcurementQuoteOption> options = dto.getOptions().stream().map(optDto -> {
            int termDays = optDto.getPaymentTermDays() != null ? optDto.getPaymentTermDays() : parsePaymentTermDays(optDto.getPaymentTerms());
            return ProcurementQuoteOption.builder()
                    .comparison(finalComp)
                    .supplierName(optDto.getSupplierName())
                    .supplierCnpj(optDto.getSupplierCnpj())
                    .supplierContact(optDto.getSupplierContact())
                    .supplierPhone(optDto.getSupplierPhone())
                    .unitPrice(optDto.getUnitPrice())
                    .totalPrice(optDto.getTotalPrice())
                    .paymentTerms(optDto.getPaymentTerms())
                    .paymentTermDays(termDays)
                    .deliveryTimeDays(optDto.getDeliveryTimeDays() != null ? optDto.getDeliveryTimeDays() : 1)
                    .shippingCost(optDto.getShippingCost() != null ? optDto.getShippingCost() : BigDecimal.ZERO)
                    .warrantyMonths(optDto.getWarrantyMonths() != null ? optDto.getWarrantyMonths() : 3)
                    .notes(optDto.getNotes())
                    .build();
        }).collect(Collectors.toList());

        options = optionRepository.saveAll(options);
        comparison.setOptions(options);

        // Executar Análise Inteligente de 3 Cotações
        evaluateTripleQuotes(comparison);

        requisition.setStatus(MaterialRequisition.RequisitionStatus.QUOTES_RECEIVED);
        requisitionRepository.save(requisition);

        return toComparisonDTO(comparison);
    }

    private int parsePaymentTermDays(String terms) {
        if (terms == null) return 0;
        String upper = terms.toUpperCase();
        if (upper.contains("90")) return 90;
        if (upper.contains("60")) return 60;
        if (upper.contains("30")) return 30;
        if (upper.contains("45")) return 45;
        if (upper.contains("15")) return 15;
        return 0; // À VISTA
    }

    public void evaluateTripleQuotes(ProcurementQuoteComparison comparison) {
        List<ProcurementQuoteOption> options = comparison.getOptions();
        if (options == null || options.isEmpty()) return;

        // Encontrar o menor preço absoluto
        ProcurementQuoteOption lowestPriceOpt = options.stream()
                .min(Comparator.comparing(ProcurementQuoteOption::getTotalPrice))
                .orElse(options.get(0));

        BigDecimal minPrice = lowestPriceOpt.getTotalPrice();
        // Margem de 5% de tolerância para avaliação de condições de pagamento e prazo
        BigDecimal threshold = minPrice.multiply(BigDecimal.valueOf(1.05));

        // Filtrar opções dentro da margem de 5% do menor preço
        List<ProcurementQuoteOption> competitiveOptions = options.stream()
                .filter(o -> o.getTotalPrice().compareTo(threshold) <= 0)
                .collect(Collectors.toList());

        // Critério de desempate / melhor condição:
        // 1. Maior prazo de pagamento (30/60/90 dias)
        // 2. Menor prazo de entrega em dias
        // 3. Menor preço
        ProcurementQuoteOption bestOption = competitiveOptions.stream()
                .max(Comparator.comparing(ProcurementQuoteOption::getPaymentTermDays)
                        .thenComparing(Comparator.comparing(ProcurementQuoteOption::getDeliveryTimeDays).reversed())
                        .thenComparing((o1, o2) -> o2.getTotalPrice().compareTo(o1.getTotalPrice())))
                .orElse(lowestPriceOpt);

        String reason;
        if (bestOption.getId().equals(lowestPriceOpt.getId()) && competitiveOptions.size() == 1) {
            reason = String.format("Recomendado por Menor Preço (R$ %.2f) com entrega em %d dia(s) e condição: %s.",
                    bestOption.getTotalPrice(), bestOption.getDeliveryTimeDays(), bestOption.getPaymentTerms());
        } else if (bestOption.getPaymentTermDays() > lowestPriceOpt.getPaymentTermDays()) {
            reason = String.format("Recomendado por Melhores Condições de Pagamento (%s - %d dias) e entrega em %d dia(s) com valor competitivo (R$ %.2f - variação dentro de 5%% do menor preço).",
                    bestOption.getPaymentTerms(), bestOption.getPaymentTermDays(), bestOption.getDeliveryTimeDays(), bestOption.getTotalPrice());
        } else if (bestOption.getDeliveryTimeDays() < lowestPriceOpt.getDeliveryTimeDays()) {
            reason = String.format("Recomendado por Menor Prazo de Entrega (%d dia(s) vs %d dias) e condição %s dentro da margem de equivalência de preço (R$ %.2f).",
                    bestOption.getDeliveryTimeDays(), lowestPriceOpt.getDeliveryTimeDays(), bestOption.getPaymentTerms(), bestOption.getTotalPrice());
        } else {
            reason = String.format("Recomendado pelo equilíbrio entre Menor Preço (R$ %.2f), Prazo (%d dias) e Condição de Pagamento (%s).",
                    bestOption.getTotalPrice(), bestOption.getDeliveryTimeDays(), bestOption.getPaymentTerms());
        }

        comparison.setSystemRecommendedOptionId(bestOption.getId());
        comparison.setSystemRecommendationReason(reason);
        comparisonRepository.save(comparison);
    }

    @Transactional
    public ProcurementPurchaseOrderDTO approveQuoteAndCreatePO(ApproveQuoteRequestDTO dto) {
        UUID companyId = TenantContext.get();
        ProcurementQuoteComparison comparison = comparisonRepository.findById(dto.getComparisonId())
                .orElseThrow(() -> new IllegalArgumentException("Comparação de cotações não encontrada: " + dto.getComparisonId()));

        ProcurementQuoteOption chosenOption = optionRepository.findById(dto.getChosenOptionId())
                .orElseThrow(() -> new IllegalArgumentException("Opção de cotação não encontrada: " + dto.getChosenOptionId()));

        User currentUser = resolveCurrentUser();

        // Marcar opção vencedora
        for (ProcurementQuoteOption opt : comparison.getOptions()) {
            opt.setIsWinner(opt.getId().equals(chosenOption.getId()));
            optionRepository.save(opt);
        }

        comparison.setChosenOptionId(chosenOption.getId());
        comparison.setOverrideReason(dto.getOverrideReason());
        comparison.setApprovedById(currentUser != null ? currentUser.getId() : null);
        comparison.setApprovedByName(currentUser != null ? currentUser.getName() : "Gestor de Manutenção");
        comparison.setApprovedAt(LocalDateTime.now());
        comparison.setStatus(ProcurementQuoteComparison.ComparisonStatus.APPROVED);
        comparisonRepository.save(comparison);

        MaterialRequisition requisition = requisitionRepository.findById(comparison.getRequisitionId())
                .orElseThrow(() -> new IllegalArgumentException("Requisição não encontrada"));

        requisition.setStatus(MaterialRequisition.RequisitionStatus.APPROVED_BY_MANAGER);
        requisition.setManagerApprovalId(currentUser != null ? currentUser.getId() : null);
        requisition.setManagerApprovalName(currentUser != null ? currentUser.getName() : "Gestor de Manutenção");
        requisition.setManagerApprovalDate(LocalDateTime.now());
        requisitionRepository.save(requisition);

        // Gerar Ordem de Compra (OC) para o Financeiro
        String ocNum = "OC-" + System.currentTimeMillis() % 1000000;
        ProcurementPurchaseOrder po = ProcurementPurchaseOrder.builder()
                .companyId(companyId != null ? companyId : requisition.getCompanyId())
                .ocNumber(ocNum)
                .requisitionId(requisition.getId())
                .comparisonId(comparison.getId())
                .winningQuoteOptionId(chosenOption.getId())
                .supplierName(chosenOption.getSupplierName())
                .supplierCnpj(chosenOption.getSupplierCnpj())
                .supplierContact(chosenOption.getSupplierContact())
                .supplierPhone(chosenOption.getSupplierPhone())
                .itemName(requisition.getItemName())
                .itemCode(requisition.getItemCode())
                .quantity(requisition.getQuantity())
                .unitPrice(chosenOption.getUnitPrice())
                .totalAmount(chosenOption.getTotalPrice())
                .paymentTerms(chosenOption.getPaymentTerms())
                .urgency(requisition.getUrgency().name())
                .justification(requisition.getJustification())
                .status(ProcurementPurchaseOrder.PurchaseOrderStatus.PENDING_FINANCIAL_APPROVAL)
                .createdById(currentUser != null ? currentUser.getId() : null)
                .createdByName(currentUser != null ? currentUser.getName() : "Sistema")
                .build();

        po = purchaseOrderRepository.save(po);

        requisition.setStatus(MaterialRequisition.RequisitionStatus.OC_GENERATED);
        requisitionRepository.save(requisition);

        return toPurchaseOrderDTO(po);
    }

    @Transactional
    public ProcurementPurchaseOrderDTO processFinancialApproval(FinancialApprovalRequestDTO dto) {
        ProcurementPurchaseOrder po = purchaseOrderRepository.findById(dto.getPurchaseOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Ordem de Compra não encontrada"));

        User currentUser = resolveCurrentUser();

        if (dto.getApproved()) {
            po.setStatus(ProcurementPurchaseOrder.PurchaseOrderStatus.FINANCIAL_APPROVED);
            po.setFinancialApprovedById(currentUser != null ? currentUser.getId() : null);
            po.setFinancialApprovedByName(currentUser != null ? currentUser.getName() : "Financeiro");
            po.setFinancialApprovedAt(LocalDateTime.now());
            po.setFinancialNotes(dto.getFinancialNotes());

            // Dados da Programação de Pagamento
            if (dto.getPaymentMethod() != null && !dto.getPaymentMethod().trim().isEmpty()) {
                po.setPaymentMethod(dto.getPaymentMethod());
            }
            if (dto.getInstallmentsCount() != null && dto.getInstallmentsCount() > 0) {
                po.setInstallmentsCount(dto.getInstallmentsCount());
            }
            if (dto.getCardNumber() != null) {
                po.setCardNumber(dto.getCardNumber());
            }
            if (dto.getCardFlag() != null) {
                po.setCardFlag(dto.getCardFlag());
            }
            if (dto.getPaymentReference() != null) {
                po.setPaymentReference(dto.getPaymentReference());
            }
            if (dto.getPaymentScheduledDate() != null) {
                po.setPaymentScheduledDate(dto.getPaymentScheduledDate());
            }
            if (dto.getPaymentDueDate() != null) {
                po.setPaymentDueDate(dto.getPaymentDueDate());
            }
            if (dto.getInstallmentDetails() != null) {
                po.setInstallmentDetails(dto.getInstallmentDetails());
            }
            po.setPaymentStatus("PROGRAMMED");
            po.setFinancialProgrammedById(currentUser != null ? currentUser.getId() : null);
            po.setFinancialProgrammedByName(currentUser != null ? currentUser.getName() : "Financeiro");
            po.setFinancialProgrammedAt(LocalDateTime.now());

            // Atualizar status da requisição
            requisitionRepository.findById(po.getRequisitionId()).ifPresent(req -> {
                req.setStatus(MaterialRequisition.RequisitionStatus.WAITING_DELIVERY);
                requisitionRepository.save(req);
            });
        } else {
            po.setStatus(ProcurementPurchaseOrder.PurchaseOrderStatus.CANCELLED);
            po.setPaymentStatus("CANCELLED");
            po.setFinancialNotes("Reprovado pelo Financeiro: " + dto.getFinancialNotes());

            requisitionRepository.findById(po.getRequisitionId()).ifPresent(req -> {
                req.setStatus(MaterialRequisition.RequisitionStatus.REJECTED);
                req.setRejectionReason("Reprovado pelo Financeiro: " + dto.getFinancialNotes());
                requisitionRepository.save(req);
            });
        }

        po = purchaseOrderRepository.save(po);
        return toPurchaseOrderDTO(po);
    }

    @Transactional
    public StockInvoiceEntryDTO registerInvoiceEntryAndReleaseStock(InvoiceEntryRequestDTO dto) {
        UUID companyId = TenantContext.get();
        User currentUser = resolveCurrentUser();

        ProcurementPurchaseOrder po = null;
        MaterialRequisition requisition = null;
        if (dto.getPurchaseOrderId() != null) {
            po = purchaseOrderRepository.findById(dto.getPurchaseOrderId()).orElse(null);
            if (po != null) {
                requisition = requisitionRepository.findById(po.getRequisitionId()).orElse(null);
            }
        }
        if (requisition == null && dto.getRequisitionId() != null) {
            requisition = requisitionRepository.findById(dto.getRequisitionId()).orElse(null);
        }

        // 1. Atualizar ou Criar Item de Estoque
        StockItem stockItem = null;
        if (dto.getStockItemId() != null) {
            stockItem = stockItemRepository.findById(dto.getStockItemId()).orElse(null);
        } else if (requisition != null && requisition.getStockItemId() != null) {
            stockItem = stockItemRepository.findById(requisition.getStockItemId()).orElse(null);
        }

        if (stockItem != null) {
            int current = stockItem.getCurrentQuantity() != null ? stockItem.getCurrentQuantity() : 0;
            stockItem.setCurrentQuantity(current + dto.getQuantityReceived().intValue());
            stockItem.setUnitCost(dto.getUnitCost());
            stockItemRepository.save(stockItem);
        }

        // 2. Calcular Lead Time SLA (da criação da requisição até a liberação no almoxarifado)
        Long leadTimeMinutes = null;
        if (requisition != null && requisition.getCreatedAt() != null) {
            leadTimeMinutes = ChronoUnit.MINUTES.between(requisition.getCreatedAt(), LocalDateTime.now());
            requisition.setReleasedAt(LocalDateTime.now());
            requisition.setSlaLeadTimeMinutes(leadTimeMinutes);
            requisition.setStatus(MaterialRequisition.RequisitionStatus.AVAILABLE_FOR_INSTALLATION);
            requisitionRepository.save(requisition);
        }

        // 3. Atualizar PO
        if (po != null) {
            po.setStatus(ProcurementPurchaseOrder.PurchaseOrderStatus.DELIVERED_IN_ALMOXARIFADO);
            po.setInvoiceNumber(dto.getInvoiceNumber());
            po.setInvoiceKey(dto.getInvoiceKey());
            po.setInvoiceReceivedAt(LocalDateTime.now());
            purchaseOrderRepository.save(po);
        }

        // 4. Criar Reserva no Estoque para a OS e transicionar status da OS
        if (requisition != null && requisition.getWorkOrderId() != null && Boolean.TRUE.equals(dto.getReleaseToWorkOrder())) {
            StockReservation reservation = StockReservation.builder()
                    .companyId(companyId != null ? companyId : requisition.getCompanyId())
                    .stockItemId(stockItem != null ? stockItem.getId() : (requisition.getStockItemId() != null ? requisition.getStockItemId() : null))
                    .workOrderId(requisition.getWorkOrderId())
                    .vehicleId(requisition.getVehicleId())
                    .requisitionId(requisition.getId())
                    .quantityReserved(requisition.getQuantity())
                    .status(StockReservation.ReservationStatus.READY_FOR_INSTALLATION)
                    .reservedById(currentUser != null ? currentUser.getId() : null)
                    .reservedByName(currentUser != null ? currentUser.getName() : "Almoxarifado")
                    .reservedAt(LocalDateTime.now())
                    .notes("Peça recebida via NF-e " + dto.getInvoiceNumber() + " e liberada para instalação.")
                    .build();
            stockReservationRepository.save(reservation);

            // Atualizar status da OS de WAITING_PARTS para IN_PROGRESS
            workOrderRepository.findById(requisition.getWorkOrderId()).ifPresent(wo -> {
                if (wo.getStatus() == FleetWorkOrder.WorkOrderStatus.WAITING_PARTS) {
                    wo.setStatus(FleetWorkOrder.WorkOrderStatus.IN_PROGRESS);
                    workOrderRepository.save(wo);
                }
            });
        }

        // 5. Registrar entrada de NF-e
        StockInvoiceEntry entry = StockInvoiceEntry.builder()
                .companyId(companyId != null ? companyId : (po != null ? po.getCompanyId() : requisition.getCompanyId()))
                .purchaseOrderId(po != null ? po.getId() : null)
                .requisitionId(requisition != null ? requisition.getId() : null)
                .stockItemId(stockItem != null ? stockItem.getId() : null)
                .invoiceNumber(dto.getInvoiceNumber())
                .invoiceSeries(dto.getInvoiceSeries())
                .invoiceKey(dto.getInvoiceKey())
                .supplierName(dto.getSupplierName())
                .supplierCnpj(dto.getSupplierCnpj())
                .issueDate(dto.getIssueDate())
                .entryDate(LocalDateTime.now())
                .quantityReceived(dto.getQuantityReceived())
                .unitCost(dto.getUnitCost())
                .totalInvoiceCost(dto.getTotalInvoiceCost())
                .receivedById(currentUser != null ? currentUser.getId() : null)
                .receivedByName(currentUser != null ? currentUser.getName() : "Almoxarifado")
                .entryType(dto.getEntryType())
                .isReleasedToWorkOrder(dto.getReleaseToWorkOrder())
                .leadTimeMinutes(leadTimeMinutes)
                .notes(dto.getNotes())
                .build();

        entry = invoiceEntryRepository.save(entry);

        return toInvoiceEntryDTO(entry);
    }

    @Transactional(readOnly = true)
    public ProcurementQuoteComparisonDTO getComparisonByRequisitionId(UUID requisitionId) {
        ProcurementQuoteComparison comparison = comparisonRepository.findByRequisitionId(requisitionId)
                .orElse(null);
        if (comparison == null) return null;
        return toComparisonDTO(comparison);
    }

    @Transactional(readOnly = true)
    public List<ProcurementPurchaseOrderDTO> listPurchaseOrders(ProcurementPurchaseOrder.PurchaseOrderStatus status) {
        UUID companyId = TenantContext.get();
        List<ProcurementPurchaseOrder> list = (status != null && companyId != null)
                ? purchaseOrderRepository.findByCompanyIdAndStatusOrderByCreatedAtDesc(companyId, status)
                : (companyId != null ? purchaseOrderRepository.findByCompanyIdOrderByCreatedAtDesc(companyId) : purchaseOrderRepository.findAll());

        return list.stream().map(this::toPurchaseOrderDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<StockInvoiceEntryDTO> listInvoiceEntries() {
        UUID companyId = TenantContext.get();
        List<StockInvoiceEntry> list = (companyId != null)
                ? invoiceEntryRepository.findByCompanyIdOrderByEntryDateDesc(companyId)
                : invoiceEntryRepository.findAll();

        return list.stream().map(this::toInvoiceEntryDTO).collect(Collectors.toList());
    }

    // Converters DTO
    public ProcurementQuoteComparisonDTO toComparisonDTO(ProcurementQuoteComparison c) {
        MaterialRequisition req = c.getRequisition();
        String reqNum = req != null ? req.getRequisitionNumber() : "";
        String itemName = req != null ? req.getItemName() : "";
        String itemCode = req != null ? req.getItemCode() : "";
        BigDecimal qty = req != null ? req.getQuantity() : BigDecimal.ONE;
        String unit = req != null ? req.getUnit() : "UN";
        String urgency = req != null ? req.getUrgency().name() : "NORMAL";
        String plate = (req != null && req.getVehicle() != null) ? req.getVehicle().getPlate() : (req != null && req.getWorkOrder() != null && req.getWorkOrder().getVehicle() != null ? req.getWorkOrder().getVehicle().getPlate() : "");
        String woNum = (req != null && req.getWorkOrder() != null) ? req.getWorkOrder().getOsNumber() : "";

        List<ProcurementQuoteOptionDTO> optDTOs = c.getOptions().stream().map(opt -> {
            boolean isSysRec = c.getSystemRecommendedOptionId() != null && c.getSystemRecommendedOptionId().equals(opt.getId());
            return ProcurementQuoteOptionDTO.builder()
                    .id(opt.getId())
                    .comparisonId(c.getId())
                    .supplierName(opt.getSupplierName())
                    .supplierCnpj(opt.getSupplierCnpj())
                    .supplierContact(opt.getSupplierContact())
                    .supplierPhone(opt.getSupplierPhone())
                    .unitPrice(opt.getUnitPrice())
                    .totalPrice(opt.getTotalPrice())
                    .paymentTerms(opt.getPaymentTerms())
                    .paymentTermDays(opt.getPaymentTermDays())
                    .deliveryTimeDays(opt.getDeliveryTimeDays())
                    .shippingCost(opt.getShippingCost())
                    .warrantyMonths(opt.getWarrantyMonths())
                    .isWinner(opt.getIsWinner())
                    .isSystemRecommended(isSysRec)
                    .proposalAttachmentUrl(opt.getProposalAttachmentUrl())
                    .notes(opt.getNotes())
                    .build();
        }).collect(Collectors.toList());

        return ProcurementQuoteComparisonDTO.builder()
                .id(c.getId())
                .companyId(c.getCompanyId())
                .requisitionId(c.getRequisitionId())
                .requisitionNumber(reqNum)
                .itemName(itemName)
                .itemCode(itemCode)
                .quantity(qty)
                .unit(unit)
                .urgency(urgency)
                .vehiclePlate(plate)
                .workOrderNumber(woNum)
                .comparisonNumber(c.getComparisonNumber())
                .status(c.getStatus())
                .systemRecommendedOptionId(c.getSystemRecommendedOptionId())
                .systemRecommendationReason(c.getSystemRecommendationReason())
                .chosenOptionId(c.getChosenOptionId())
                .overrideReason(c.getOverrideReason())
                .approvedById(c.getApprovedById())
                .approvedByName(c.getApprovedByName())
                .approvedAt(c.getApprovedAt())
                .createdAt(c.getCreatedAt())
                .options(optDTOs)
                .build();
    }

    public ProcurementPurchaseOrderDTO toPurchaseOrderDTO(ProcurementPurchaseOrder po) {
        MaterialRequisition req = po.getRequisition();
        String reqNum = req != null ? req.getRequisitionNumber() : "";
        UUID woId = req != null ? req.getWorkOrderId() : null;
        String woNum = (req != null && req.getWorkOrder() != null) ? req.getWorkOrder().getOsNumber() : "";
        UUID vId = req != null ? req.getVehicleId() : null;
        String plate = (req != null && req.getVehicle() != null) ? req.getVehicle().getPlate() : (req != null && req.getWorkOrder() != null && req.getWorkOrder().getVehicle() != null ? req.getWorkOrder().getVehicle().getPlate() : "");

        return ProcurementPurchaseOrderDTO.builder()
                .id(po.getId())
                .companyId(po.getCompanyId())
                .ocNumber(po.getOcNumber())
                .requisitionId(po.getRequisitionId())
                .requisitionNumber(reqNum)
                .workOrderId(woId)
                .workOrderNumber(woNum)
                .vehicleId(vId)
                .vehiclePlate(plate)
                .comparisonId(po.getComparisonId())
                .winningQuoteOptionId(po.getWinningQuoteOptionId())
                .supplierName(po.getSupplierName())
                .supplierCnpj(po.getSupplierCnpj())
                .supplierContact(po.getSupplierContact())
                .supplierPhone(po.getSupplierPhone())
                .itemName(po.getItemName())
                .itemCode(po.getItemCode())
                .quantity(po.getQuantity())
                .unitPrice(po.getUnitPrice())
                .totalAmount(po.getTotalAmount())
                .paymentTerms(po.getPaymentTerms())
                .deliveryEstimatedDate(po.getDeliveryEstimatedDate())
                .urgency(po.getUrgency())
                .justification(po.getJustification())
                .status(po.getStatus())
                .statusDescription(getPoStatusDescription(po.getStatus()))
                .financialApprovedById(po.getFinancialApprovedById())
                .financialApprovedByName(po.getFinancialApprovedByName())
                .financialApprovedAt(po.getFinancialApprovedAt())
                .financialNotes(po.getFinancialNotes())
                .paymentMethod(po.getPaymentMethod())
                .installmentsCount(po.getInstallmentsCount())
                .cardNumber(po.getCardNumber())
                .cardFlag(po.getCardFlag())
                .paymentReference(po.getPaymentReference())
                .paymentScheduledDate(po.getPaymentScheduledDate())
                .paymentDueDate(po.getPaymentDueDate())
                .paymentStatus(po.getPaymentStatus())
                .installmentDetails(po.getInstallmentDetails())
                .financialProgrammedById(po.getFinancialProgrammedById())
                .financialProgrammedByName(po.getFinancialProgrammedByName())
                .financialProgrammedAt(po.getFinancialProgrammedAt())
                .invoiceNumber(po.getInvoiceNumber())
                .invoiceKey(po.getInvoiceKey())
                .invoiceReceivedAt(po.getInvoiceReceivedAt())
                .createdById(po.getCreatedById())
                .createdByName(po.getCreatedByName())
                .createdAt(po.getCreatedAt())
                .updatedAt(po.getUpdatedAt())
                .build();
    }

    private String getPoStatusDescription(ProcurementPurchaseOrder.PurchaseOrderStatus s) {
        if (s == null) return "";
        switch (s) {
            case PENDING_FINANCIAL_APPROVAL: return "Pendente Aprovação Financeira";
            case FINANCIAL_APPROVED: return "Aprovado pelo Financeiro";
            case PURCHASED_IN_TRANSIT: return "Em Trânsito / Compra Realizada";
            case DELIVERED_IN_ALMOXARIFADO: return "Entregue e Lançado no Almoxarifado";
            case CANCELLED: return "Cancelada";
            default: return s.name();
        }
    }

    public StockInvoiceEntryDTO toInvoiceEntryDTO(StockInvoiceEntry e) {
        String ocNum = e.getPurchaseOrder() != null ? e.getPurchaseOrder().getOcNumber() : "";
        String reqNum = e.getRequisition() != null ? e.getRequisition().getRequisitionNumber() : "";
        UUID woId = e.getRequisition() != null ? e.getRequisition().getWorkOrderId() : null;
        String woNum = (e.getRequisition() != null && e.getRequisition().getWorkOrder() != null) ? e.getRequisition().getWorkOrder().getOsNumber() : "";
        String itemName = e.getStockItem() != null ? e.getStockItem().getName() : (e.getRequisition() != null ? e.getRequisition().getItemName() : "");
        String itemCode = e.getStockItem() != null ? e.getStockItem().getCode() : (e.getRequisition() != null ? e.getRequisition().getItemCode() : "");

        String formattedLeadTime = "";
        if (e.getLeadTimeMinutes() != null) {
            long mins = e.getLeadTimeMinutes();
            long hours = mins / 60;
            long remMins = mins % 60;
            formattedLeadTime = hours > 0 ? String.format("%dh %02dmin", hours, remMins) : String.format("%d min", mins);
        }

        return StockInvoiceEntryDTO.builder()
                .id(e.getId())
                .companyId(e.getCompanyId())
                .purchaseOrderId(e.getPurchaseOrderId())
                .ocNumber(ocNum)
                .requisitionId(e.getRequisitionId())
                .requisitionNumber(reqNum)
                .workOrderId(woId)
                .workOrderNumber(woNum)
                .stockItemId(e.getStockItemId())
                .stockItemName(itemName)
                .stockItemCode(itemCode)
                .invoiceNumber(e.getInvoiceNumber())
                .invoiceSeries(e.getInvoiceSeries())
                .invoiceKey(e.getInvoiceKey())
                .supplierName(e.getSupplierName())
                .supplierCnpj(e.getSupplierCnpj())
                .issueDate(e.getIssueDate())
                .entryDate(e.getEntryDate())
                .quantityReceived(e.getQuantityReceived())
                .unitCost(e.getUnitCost())
                .totalInvoiceCost(e.getTotalInvoiceCost())
                .receivedById(e.getReceivedById())
                .receivedByName(e.getReceivedByName())
                .entryType(e.getEntryType())
                .isReleasedToWorkOrder(e.getIsReleasedToWorkOrder())
                .leadTimeMinutes(e.getLeadTimeMinutes())
                .formattedLeadTime(formattedLeadTime)
                .notes(e.getNotes())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
