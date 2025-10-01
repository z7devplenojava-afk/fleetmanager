package br.com.fleetmanager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "inventory_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_id", nullable = false)
    private Inventory inventory;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;
    
    @Column(nullable = false, length = 100)
    private String itemName;
    
    @Column(length = 500)
    private String description;
    
    @Column(length = 50)
    private String code;
    
    @Column(length = 50)
    private String barcode;
    
    @Column(length = 20)
    private String unit; // UN, KG, L, M, etc.
    
    @Column(precision = 10, scale = 2)
    private BigDecimal expectedQuantity;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal countedQuantity;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal varianceQuantity;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal unitPrice;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal expectedValue;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal countedValue;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal varianceValue;
    
    @Column(length = 100)
    private String location;
    
    @Column(length = 20)
    private String status; // PENDING, COUNTED, VERIFIED, DISPUTED
    
    @Column(length = 20)
    private String condition; // GOOD, DAMAGED, EXPIRED, LOST
    
    @Column(length = 500)
    private String notes;
    
    @Column(length = 100)
    private String countedBy;
    
    @Column(name = "counted_at")
    private LocalDateTime countedAt;
    
    @Column(length = 100)
    private String verifiedBy;
    
    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;
    
    @Column(length = 500)
    private String verificationNotes;
    
    @Column(length = 20)
    private String varianceType; // NONE, POSITIVE, NEGATIVE
    
    @Column(precision = 5, scale = 2)
    private BigDecimal accuracyPercentage;
    
    @Column(length = 100)
    private String brand;
    
    @Column(length = 100)
    private String model;
    
    @Column(length = 100)
    private String category;
    
    @Column(length = 20)
    private String priority; // LOW, MEDIUM, HIGH, CRITICAL
    
    @Column(length = 20)
    private String abcClassification; // A, B, C
    
    @Column(precision = 10, scale = 2)
    private BigDecimal minimumStock;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal maximumStock;
    
    @Column(length = 20)
    private String stockStatus; // NORMAL, LOW, OUT_OF_STOCK, OVERSTOCK
    
    @Column(name = "last_counted_date")
    private LocalDateTime lastCountedDate;
    
    @Column(name = "next_counted_date")
    private LocalDateTime nextCountedDate;
    
    // Métodos de negócio
    public void calculateVariance() {
        if (expectedQuantity != null && countedQuantity != null) {
            this.varianceQuantity = countedQuantity.subtract(expectedQuantity);
        }
    }
    
    public void calculateValueVariance() {
        if (expectedValue != null && countedValue != null) {
            this.varianceValue = countedValue.subtract(expectedValue);
        }
    }
    
    public void calculateAccuracy() {
        if (expectedQuantity != null && expectedQuantity.compareTo(BigDecimal.ZERO) > 0 && countedQuantity != null) {
            BigDecimal accuracy = countedQuantity.divide(expectedQuantity, 4, BigDecimal.ROUND_HALF_UP)
                                               .multiply(BigDecimal.valueOf(100));
            this.accuracyPercentage = accuracy;
        }
    }
    
    public void determineVarianceType() {
        if (varianceQuantity != null) {
            if (varianceQuantity.compareTo(BigDecimal.ZERO) > 0) {
                this.varianceType = "POSITIVE";
            } else if (varianceQuantity.compareTo(BigDecimal.ZERO) < 0) {
                this.varianceType = "NEGATIVE";
            } else {
                this.varianceType = "NONE";
            }
        }
    }
    
    public boolean hasVariance() {
        return varianceQuantity != null && varianceQuantity.compareTo(BigDecimal.ZERO) != 0;
    }
    
    public boolean isCounted() {
        return "COUNTED".equals(status) || "VERIFIED".equals(status);
    }
    
    public boolean isVerified() {
        return "VERIFIED".equals(status);
    }
    
    public boolean isDisputed() {
        return "DISPUTED".equals(status);
    }
    
    public boolean isLowStock() {
        return countedQuantity != null && minimumStock != null && 
               countedQuantity.compareTo(minimumStock) <= 0;
    }
    
    public boolean isOverStock() {
        return countedQuantity != null && maximumStock != null && 
               countedQuantity.compareTo(maximumStock) >= 0;
    }
    
    public String getStockStatus() {
        if (countedQuantity == null || countedQuantity.compareTo(BigDecimal.ZERO) <= 0) {
            return "OUT_OF_STOCK";
        }
        if (isLowStock()) return "LOW";
        if (isOverStock()) return "OVERSTOCK";
        return "NORMAL";
    }
} 