package br.com.fleetmanager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import br.com.fleetmanager.model.enums.StockCategory;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "stock_items")
@Data
@EqualsAndHashCode(callSuper = false)
public class StockItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "code", unique = true, nullable = false)
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

    @Column(name = "supplier")
    private String supplier;

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

    // Método para verificar se está em baixa quantidade
    public boolean isLowStock() {
        return currentQuantity != null && minimumQuantity != null && 
               currentQuantity <= minimumQuantity;
    }

    // Método para gerar código QR único
    @PrePersist
    public void generateQrCode() {
        if (qrCode == null) {
            qrCode = "STOCK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
    }

    // Método para atualizar quantidade
    public void updateQuantity(Integer quantity) {
        this.currentQuantity = (this.currentQuantity != null ? this.currentQuantity : 0) + quantity;
        if (this.currentQuantity < 0) {
            this.currentQuantity = 0;
        }
    }

    // Método para obter nome completo do item
    public String getFullName() {
        if (sizeVariation != null && !sizeVariation.trim().isEmpty()) {
            return name + " - " + sizeVariation;
        }
        return name;
    }
}