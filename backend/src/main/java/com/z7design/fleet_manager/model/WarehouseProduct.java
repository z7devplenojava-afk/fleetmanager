package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.z7design.fleet_manager.model.enums.WarehouseTrackingType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Cadastro comercial de produto do Almoxarifado Operacional com modalidade de controle.
 */
@Entity
@Table(name = "warehouse_products", uniqueConstraints = {
    @UniqueConstraint(name = "uk_wh_prod_code", columnNames = {"company_id", "code"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class WarehouseProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private WarehouseCategory category;

    @Column(nullable = false, length = 50)
    private String code;

    @Column(length = 60)
    private String barcode;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "unit_measure", nullable = false, length = 10)
    private String unitMeasure; // UN, LT, KG, PAR, MT

    @Enumerated(EnumType.STRING)
    @Column(name = "tracking_type", nullable = false, length = 30)
    @Builder.Default
    private WarehouseTrackingType trackingType = WarehouseTrackingType.QUANTITY;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_location_id")
    private WarehouseLocation defaultLocation;

    @Column(name = "min_stock", nullable = false, precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal minStock = BigDecimal.ZERO;

    @Column(name = "max_stock", nullable = false, precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal maxStock = BigDecimal.ZERO;

    @Column(name = "reorder_point", nullable = false, precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal reorderPoint = BigDecimal.ZERO;

    @Column(name = "lead_time_days")
    @Builder.Default
    private Integer leadTimeDays = 7;

    @Column(name = "unit_cost_average", precision = 15, scale = 4)
    @Builder.Default
    private BigDecimal unitCostAverage = BigDecimal.ZERO;

    @Column(name = "last_purchase_price", precision = 15, scale = 4)
    @Builder.Default
    private BigDecimal lastPurchasePrice = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
