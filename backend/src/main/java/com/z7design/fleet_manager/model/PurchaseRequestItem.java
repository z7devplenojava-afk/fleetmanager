package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "purchase_request_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseRequestItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_request_id", nullable = false)
    private PurchaseRequest purchaseRequest;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;
    
    @Column(nullable = false, length = 100)
    private String itemName;
    
    @Column(length = 500)
    private String description;
    
    @Column(length = 50)
    private String specification;
    
    @Column(length = 20)
    private String unit; // UN, KG, L, M, etc.
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal unitPrice;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal totalPrice;
    
    @Column(length = 100)
    private String brand;
    
    @Column(length = 100)
    private String model;
    
    @Column(length = 100)
    private String supplier;
    
    @Column(length = 20)
    private String priority; // LOW, MEDIUM, HIGH, URGENT
    
    @Column(length = 20)
    private String status; // PENDING, APPROVED, REJECTED, PURCHASED
    
    @Column(length = 500)
    private String justification;
    
    @Column(length = 100)
    private String alternativeSupplier;
    
    @Column(length = 500)
    private String notes;
    
    @Column(length = 20)
    private String urgency; // NORMAL, URGENT, CRITICAL
    
    @Column(precision = 10, scale = 2)
    private BigDecimal currentStock;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal minimumStock;
    
    @Column(length = 20)
    private String stockStatus; // NORMAL, LOW, OUT_OF_STOCK
    
    @Column(length = 100)
    private String approvedBy;
    
    @Column(length = 500)
    private String approvalNotes;
    
    @Column(length = 100)
    private String rejectedBy;
    
    @Column(length = 500)
    private String rejectionReason;
    
    // MÃ©todos de negÃ³cio
    public void calculateTotalPrice() {
        if (quantity != null && unitPrice != null) {
            this.totalPrice = quantity.multiply(unitPrice);
        }
    }
    
    public boolean isUrgent() {
        return "URGENT".equals(priority) || "CRITICAL".equals(urgency);
    }
    
    public boolean isLowStock() {
        return currentStock != null && minimumStock != null && 
               currentStock.compareTo(minimumStock) <= 0;
    }
    
    public boolean isOutOfStock() {
        return currentStock != null && currentStock.compareTo(BigDecimal.ZERO) <= 0;
    }
    
    public String getStockStatus() {
        if (isOutOfStock()) return "OUT_OF_STOCK";
        if (isLowStock()) return "LOW";
        return "NORMAL";
    }
}
