package com.z7design.fleet_manager.dto.procurement;

import com.z7design.fleet_manager.model.ProcurementPurchaseOrder;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcurementPurchaseOrderDTO {
    private UUID id;
    private UUID companyId;
    private String ocNumber;
    private UUID requisitionId;
    private String requisitionNumber;
    private UUID workOrderId;
    private String workOrderNumber;
    private UUID vehicleId;
    private String vehiclePlate;
    private UUID comparisonId;
    private UUID winningQuoteOptionId;
    private String supplierName;
    private String supplierCnpj;
    private String supplierContact;
    private String supplierPhone;
    private String itemName;
    private String itemCode;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalAmount;
    private String paymentTerms;
    private LocalDate deliveryEstimatedDate;
    private String urgency;
    private String justification;
    private ProcurementPurchaseOrder.PurchaseOrderStatus status;
    private String statusDescription;
    private UUID financialApprovedById;
    private String financialApprovedByName;
    private LocalDateTime financialApprovedAt;
    private String financialNotes;
    // Campos de Programação Financeira e Cartão
    private String paymentMethod;
    private Integer installmentsCount;
    private String cardNumber;
    private String cardFlag;
    private String paymentReference;
    private LocalDate paymentScheduledDate;
    private LocalDate paymentDueDate;
    private String paymentStatus;
    private String installmentDetails;
    private UUID financialProgrammedById;
    private String financialProgrammedByName;
    private LocalDateTime financialProgrammedAt;

    private String invoiceNumber;
    private String invoiceKey;
    private LocalDateTime invoiceReceivedAt;
    private UUID createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
