package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.PurchaseQuotationStatus;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseQuotationDTO {
    
    private UUID id;
    private String quoteNumber;
    private String title;
    private String description;
    private UUID supplierId;
    private String supplierName;
    private UUID unitId;
    private String unitName;
    private UUID purchaseRequestId;
    private String purchaseRequestNumber;
    private String purchaseRequestTitle;
    private PurchaseQuotationStatus status;
    private BigDecimal totalValue;
    private LocalDate validUntil;
    private String terms;
    private String paymentMethod;
    private String deliveryMethod;
    private String notes;
    private UUID createdById;
    private String createdByName;
    private UUID assignedToId;
    private String assignedToName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Campos calculados
    private boolean expired;
    private boolean expiringSoon;
    private boolean canBeApproved;
    private boolean canBeRejected;
}






