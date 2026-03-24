package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import com.z7design.fleet_manager.tenant.TenantAware;
import org.hibernate.annotations.Filter;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class Product implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(length = 50)
    private String code;

    @Column(length = 50)
    private String barcode;

    @Column(length = 50)
    private String category;

    @Column(length = 50)
    private String brand;

    @Column(length = 50)
    private String model;

    @Column(length = 20)
    private String unit; // UN, KG, L, M, etc.

    @Column(precision = 10, scale = 2)
    private BigDecimal costPrice;

    @Column(precision = 10, scale = 2)
    private BigDecimal salePrice;

    @Column(precision = 10, scale = 2)
    private BigDecimal currentStock;

    @Column(precision = 10, scale = 2)
    private BigDecimal minimumStock;

    @Column(precision = 10, scale = 2)
    private BigDecimal maximumStock;

    @Column(precision = 10, scale = 2)
    private BigDecimal reorderPoint;

    @Column(length = 20)
    private String status; // ACTIVE, INACTIVE, DISCONTINUED

    @Column(length = 100)
    private String location; // LocalizaÃ§Ã£o fÃ­sica no estoque

    @Column(length = 100)
    private String supplier;

    @Column(length = 20)
    private String shelfLife; // Vida Ãºtil em dias

    @Column(precision = 10, scale = 2)
    private BigDecimal weight;

    @Column(length = 20)
    private String weightUnit; // KG, G, etc.

    @Column(length = 100)
    private String dimensions; // LxAxC

    @Column(length = 20)
    private String storageConditions; // TEMPERATURE_CONTROLLED, DRY, etc.

    @Column(length = 500)
    private String notes;

    // Campos para variaÃ§Ãµes de produtos
    @Column(length = 20)
    private String size; // Tamanho (P, M, G, GG, 36, 37, 38, etc.)

    @Column(length = 20)
    private String color; // Cor (Cinza, Preto, Branco, Azul, etc.)

    @Column(length = 50)
    private String productType; // Tipo (PadrÃ£o, Social, Convencional, Nilon, TÃ¡ticos, etc.)

    @Column(length = 20)
    private String footwearSize; // NumeraÃ§Ã£o para calÃ§ados (36, 37, 38, etc.)

    @Column(length = 20)
    private String clothingSize; // Tamanho para roupas (P, M, G, GG, etc.)

    @Column(length = 20)
    private String beltSize; // Tamanho para cintos (90, 95, 100, etc.)

    @Column(length = 50)
    private String material; // Material (AlgodÃ£o, PoliÃ©ster, Couro, etc.)

    @Column(length = 50)
    private String style; // Estilo (Casual, Formal, Esportivo, etc.)

    @Column(length = 20)
    private String gender; // GÃªnero (Masculino, Feminino, Unissex)

    @Column(length = 50)
    private String season; // EstaÃ§Ã£o (VerÃ£o, Inverno, Primavera, Outono, Todas)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id")
    private Unit unitEntity;

    @Column(name = "last_inventory_date")
    private LocalDateTime lastInventoryDate;

    @Column(name = "next_inventory_date")
    private LocalDateTime nextInventoryDate;

    @Column(name = "last_purchase_date")
    private LocalDateTime lastPurchaseDate;

    @Column(name = "last_sale_date")
    private LocalDateTime lastSaleDate;

    @Column(precision = 10, scale = 2)
    private BigDecimal averageConsumption; // Consumo mÃ©dio por perÃ­odo

    @Column(length = 20)
    private String consumptionPeriod; // DAILY, WEEKLY, MONTHLY

    @Column(precision = 10, scale = 2)
    private BigDecimal safetyStock; // Estoque de seguranÃ§a

    @Column(precision = 10, scale = 2)
    private BigDecimal leadTime; // Tempo de reposiÃ§Ã£o em dias

    @Column(length = 20)
    private String abcClassification; // A, B, C (AnÃ¡lise ABC)

    @Column(precision = 10, scale = 2)
    private BigDecimal turnoverRate; // Taxa de giro

    @Column(precision = 10, scale = 2)
    private BigDecimal daysOfInventory; // Dias de estoque

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "company_id")
    private UUID companyId;

    // MÃ©todos de negÃ³cio
    public boolean isLowStock() {
        return currentStock.compareTo(minimumStock) <= 0;
    }

    public boolean isOverStock() {
        return currentStock.compareTo(maximumStock) >= 0;
    }

    public boolean needsReorder() {
        return currentStock.compareTo(reorderPoint) <= 0;
    }

    public BigDecimal getStockLevel() {
        if (maximumStock.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return currentStock.divide(maximumStock, 2, BigDecimal.ROUND_HALF_UP).multiply(BigDecimal.valueOf(100));
    }

    public String getStockStatus() {
        if (isLowStock())
            return "LOW";
        if (isOverStock())
            return "HIGH";
        if (needsReorder())
            return "REORDER";
        return "NORMAL";
    }

    public BigDecimal calculateReorderQuantity() {
        return maximumStock.subtract(currentStock).max(BigDecimal.ONE);
    }
}
