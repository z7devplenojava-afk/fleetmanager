package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.PurchaseQuotationStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "purchase_quotations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseQuotation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "quote_number", unique = true, length = 50)
    private String quoteNumber;
    
    @NotBlank(message = "TÃ­tulo Ã© obrigatÃ³rio")
    @Size(max = 255, message = "TÃ­tulo deve ter no mÃ¡ximo 255 caracteres")
    @Column(name = "title", nullable = false)
    private String title;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id")
    private Unit unit;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_request_id")
    private PurchaseRequest purchaseRequest;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PurchaseQuotationStatus status = PurchaseQuotationStatus.DRAFT;
    
    @NotNull(message = "Valor total Ã© obrigatÃ³rio")
    @Column(name = "total_value", precision = 15, scale = 2, nullable = false)
    private BigDecimal totalValue;
    
    @Column(name = "valid_until")
    private LocalDate validUntil;
    
    @Column(name = "terms", length = 500)
    private String terms;
    
    @Column(name = "payment_method", length = 100)
    private String paymentMethod;
    
    @Column(name = "delivery_method", length = 100)
    private String deliveryMethod;
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // MÃ©todos de negÃ³cio
    public boolean isExpired() {
        return validUntil != null && LocalDate.now().isAfter(validUntil);
    }
    
    public boolean isExpiringSoon(int days) {
        if (validUntil == null) return false;
        LocalDate today = LocalDate.now();
        LocalDate expirationDate = validUntil;
        return !expirationDate.isBefore(today) && 
               !expirationDate.isAfter(today.plusDays(days));
    }
    
    public boolean canBeApproved() {
        return status == PurchaseQuotationStatus.SENT;
    }
    
    public boolean canBeRejected() {
        return status == PurchaseQuotationStatus.SENT || status == PurchaseQuotationStatus.DRAFT;
    }
}






