package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

import com.z7design.fleet_manager.tenant.TenantAware;
import org.hibernate.annotations.Filter;

@Entity
@Table(name = "fuel_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class FuelRecord implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Vehicle.FuelType fuelType;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal cost;

    @Column(nullable = false)
    private Integer mileage;

    @Column(name = "initial_mileage")
    private Integer initialMileage;

    @Column(name = "final_mileage")
    private Integer finalMileage;

    @Column
    private String station;

    @ManyToOne
    @JoinColumn(name = "driver_id")
    private Driver driver;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "receipt_url")
    private String receiptUrl;

    @Column(name = "cost_center")
    private String costCenter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_post_id")
    private WorkPost workPost;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private Contract contract;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @Column(name = "price_per_liter", precision = 10, scale = 4)
    private BigDecimal pricePerLiter;

    @Column(name = "client_name")
    private String clientName;

    @Column(name = "obra_name")
    private String obraName;

    @Column(name = "contract_number")
    private String contractNumber;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "company_id")
    private UUID companyId;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
