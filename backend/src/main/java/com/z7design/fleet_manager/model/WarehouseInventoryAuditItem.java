package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Item auditado em inventário com comparação de quantidade no sistema, 1ª e 2ª contagem e apuração de divergência.
 */
@Entity
@Table(name = "warehouse_inventory_audit_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class WarehouseInventoryAuditItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_id", nullable = false)
    @JsonIgnore
    private WarehouseInventoryAudit audit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private WarehouseProduct product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private WarehouseLocation location;

    @Column(name = "quantity_system", nullable = false, precision = 12, scale = 3)
    private BigDecimal quantitySystem;

    @Column(name = "quantity_count_1", precision = 12, scale = 3)
    private BigDecimal quantityCount1;

    @Column(name = "quantity_count_2", precision = 12, scale = 3)
    private BigDecimal quantityCount2;

    @Column(name = "quantity_final", precision = 12, scale = 3)
    private BigDecimal quantityFinal;

    @Column(precision = 12, scale = 3)
    private BigDecimal difference; // quantityFinal - quantitySystem

    @Column(name = "unit_cost", nullable = false, precision = 15, scale = 4)
    @Builder.Default
    private BigDecimal unitCost = BigDecimal.ZERO;

    @Column(name = "divergence_value", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal divergenceValue = BigDecimal.ZERO; // difference * unitCost

    @Column(length = 20)
    @Builder.Default
    private String status = "PENDENTE"; // OK, DIVERGENTE, AJUSTADO

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
