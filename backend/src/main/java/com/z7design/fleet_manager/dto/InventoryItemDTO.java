package com.z7design.fleet_manager.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItemDTO {
    
    private UUID id;
    private UUID inventoryId;
    private UUID productId;
    private String productName;
    private String itemName;
    private String description;
    private String code;
    private String barcode;
    private String unit;
    private BigDecimal expectedQuantity;
    private BigDecimal countedQuantity;
    private BigDecimal varianceQuantity;
    private BigDecimal unitPrice;
    private BigDecimal expectedValue;
    private BigDecimal countedValue;
    private BigDecimal varianceValue;
    private String location;
    private String status;
    private String condition;
    private String notes;
    private String countedBy;
    private LocalDateTime countedAt;
    private String verifiedBy;
    private LocalDateTime verifiedAt;
    private String verificationNotes;
    private String varianceType;
    private BigDecimal accuracyPercentage;
    private String brand;
    private String model;
    private String category;
    private String priority;
    private String abcClassification;
    private BigDecimal minimumStock;
    private BigDecimal maximumStock;
    private String stockStatus;
    private LocalDateTime lastCountedDate;
    private LocalDateTime nextCountedDate;
    
    // Campos calculados
    private boolean hasVariance;
    private boolean counted;
    private boolean verified;
    private boolean disputed;
    private boolean lowStock;
    private boolean overStock;
} 
