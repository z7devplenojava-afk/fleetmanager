package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.tenant.TenantAware;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "fuel_tanks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class FuelTank implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal capacity;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal currentLevel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Vehicle.FuelType fuelType;

    /** Garagem onde o tanque está instalado. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "garage_id")
    private Garage garage;

    @Column(name = "company_id")
    private UUID companyId;

    /** Último patamar de alerta disparado (ex: 5000, 3000, 2000) */
    @Column(name = "last_alert_threshold", precision = 12, scale = 2)
    private BigDecimal lastAlertThreshold;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
