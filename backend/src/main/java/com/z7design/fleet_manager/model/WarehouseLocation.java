package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Endereçamento físico no almoxarifado (corredor, estante, prateleira, vão).
 */
@Entity
@Table(name = "warehouse_locations", uniqueConstraints = {
    @UniqueConstraint(name = "uk_wh_loc_code", columnNames = {"company_id", "full_code"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class WarehouseLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "warehouse_name", nullable = false, length = 60)
    @Builder.Default
    private String warehouseName = "Almoxarifado Central";

    @Column(nullable = false, length = 20)
    private String aisle; // Corredor / Rua

    @Column(nullable = false, length = 20)
    private String shelf; // Estante / Módulo

    @Column(nullable = false, length = 20)
    private String level; // Prateleira / Nível

    @Column(name = "bin_position", length = 20)
    private String binPosition; // Vão / Gaveta

    @Column(name = "full_code", nullable = false, length = 80)
    private String fullCode; // Ex: ALM-A-01-02

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
