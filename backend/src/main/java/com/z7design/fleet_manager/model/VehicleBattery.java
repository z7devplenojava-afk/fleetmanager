package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Bateria de um veículo (controle de troca, validade da garantia e custo).
 */
@Entity
@Table(name = "vehicle_batteries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleBattery {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private WarehouseProduct product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inbound_item_id")
    private WarehouseInboundItem inboundItem;

    @Column(name = "serial_number", length = 60)
    private String serialNumber;

    @Column(name = "battery_code", length = 60)
    private String batteryCode;

    @Column(length = 60)
    private String brand;

    @Column(length = 60)
    private String model;

    @Column(length = 20)
    private String voltage;

    @Column(length = 30)
    private String capacity;

    @Column(name = "cca_rating")
    private Integer ccaRating; // Corrente de partida a frio

    @Column(name = "install_km")
    private Integer installKm;

    @Column(name = "install_date")
    private LocalDate installDate;

    @Column(name = "removal_date")
    private LocalDate removalDate;

    @Column(name = "removal_reason", length = 100)
    private String removalReason;

    @Column(name = "warranty_expiry_date")
    private LocalDate warrantyExpiryDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BatteryStatus status = BatteryStatus.ACTIVE;

    @Column(precision = 12, scale = 2)
    private BigDecimal cost;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "company_id")
    private UUID companyId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum BatteryStatus {
        ACTIVE,
        REPLACED,
        SCRAPPED
    }
}
