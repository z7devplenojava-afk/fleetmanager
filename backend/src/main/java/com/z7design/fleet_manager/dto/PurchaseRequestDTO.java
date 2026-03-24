package com.z7design.fleet_manager.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseRequestDTO {
    
    private UUID id;
    private String requestNumber;
    private String title;
    private String description;
    private String priority;
    private String status;
    private String requesterName;
    private String department;
    private String justification;
    private BigDecimal estimatedTotal;
    private String urgency;
    private LocalDateTime requiredDate;
    private LocalDateTime requestDate;
    private LocalDateTime approvalDate;
    private LocalDateTime completionDate;
    private String approvedBy;
    private String approvalNotes;
    private String supplier;
    private String paymentMethod;
    private Integer installments;
    private String deliveryMethod;
    private String deliveryAddress;
    private String contactPerson;
    private String contactPhone;
    private String contactEmail;
    private String notes;
    private UUID unitId;
    private String unitName;
    private UUID requesterId;
    private UUID approverId;
    private String approverName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Campos calculados
    private boolean urgent;
    private boolean canBeApproved;
    private boolean overdue;
    private long daysUntilRequired;
    private List<PurchaseRequestItemDTO> items;
    private int totalItems;
    private BigDecimal totalValue;
}
