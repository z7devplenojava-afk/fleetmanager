package br.com.fleetmanager.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseRequestItemDTO {
    
    private UUID id;
    private UUID purchaseRequestId;
    private UUID productId;
    private String productName;
    private String itemName;
    private String description;
    private String specification;
    private String unit;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
    private String brand;
    private String model;
    private String supplier;
    private String priority;
    private String status;
    private String justification;
    private String alternativeSupplier;
    private String notes;
    private String urgency;
    private BigDecimal currentStock;
    private BigDecimal minimumStock;
    private String stockStatus;
    private String approvedBy;
    private String approvalNotes;
    private String rejectedBy;
    private String rejectionReason;
    
    // Campos calculados
    private boolean urgent;
    private boolean lowStock;
    private boolean outOfStock;
}