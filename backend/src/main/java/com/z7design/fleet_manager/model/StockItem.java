package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.StockCategory;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.z7design.fleet_manager.tenant.TenantAware;
import org.hibernate.annotations.Filter;

@Entity
@Table(name = "stock_items", uniqueConstraints = {
    @UniqueConstraint(name = "uk_stock_items_company_code", columnNames = {"company_id", "code"})
})
@Data
@EqualsAndHashCode(callSuper = false)
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class StockItem implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private StockCategory category;

    @Column(name = "size_variation")
    private String sizeVariation; // P, M, G, GG, EXG ou 36, 37, 38...

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "current_quantity", nullable = false)
    private Integer currentQuantity = 0;

    @Column(name = "minimum_quantity")
    private Integer minimumQuantity = 0;

    @Column(name = "unit_cost", precision = 10, scale = 2)
    private java.math.BigDecimal unitCost;

    @Column(name = "average_cost", precision = 10, scale = 2)
    private java.math.BigDecimal averageCost;

    @Column(name = "supplier")
    private String supplier;

    @Column(name = "invoice_number")
    private String invoiceNumber;

    @Column(name = "barcode")
    private String barcode;

    @Column(name = "qr_code")
    private String qrCode;

    @Column(name = "active", nullable = false)
    private Boolean active = true;

    @OneToMany(mappedBy = "stockItem", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<StockMovement> movements = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id")
    private Unit unit;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // MÃ©todo para verificar se estÃ¡ em baixa quantidade
    public boolean isLowStock() {
        return currentQuantity != null && minimumQuantity != null &&
                currentQuantity <= minimumQuantity;
    }

    // MÃ©todo para gerar cÃ³digo QR Ãºnico
    @PrePersist
    public void generateQrCode() {
        if (qrCode == null) {
            qrCode = "STOCK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
    }

    // MÃ©todo para atualizar quantidade
    public void updateQuantity(Integer quantity) {
        this.currentQuantity = (this.currentQuantity != null ? this.currentQuantity : 0) + quantity;
        if (this.currentQuantity < 0) {
            this.currentQuantity = 0;
        }
    }

    // MÃ©todo para obter nome completo do item
    public String getFullName() {
        if (sizeVariation != null && !sizeVariation.trim().isEmpty()) {
            return name + " - " + sizeVariation;
        }
        return name;
    }
}
