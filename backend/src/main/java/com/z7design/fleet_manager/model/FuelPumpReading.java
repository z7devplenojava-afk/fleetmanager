package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.tenant.TenantAware;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "fuel_pump_readings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class FuelPumpReading implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private LocalDate readingDate;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal initialValue;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal finalValue;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalLiters;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fuel_pump_id", nullable = false)
    private FuelPump fuelPump;

    @Column(name = "company_id")
    private UUID companyId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
