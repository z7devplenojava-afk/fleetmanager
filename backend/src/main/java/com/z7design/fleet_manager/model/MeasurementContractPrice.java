package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "measurement_contract_prices")
@Data
@EqualsAndHashCode(callSuper = false)
public class MeasurementContractPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    private MeasurementContract contract;

    @Column(name = "vehicle_type")
    private String vehicleType;

    @Column(name = "service_name", nullable = false)
    private String serviceName;

    @Column(name = "monthly_price", precision = 15, scale = 2)
    private BigDecimal monthlyPrice = BigDecimal.ZERO;

    @Column(name = "daily_price", precision = 15, scale = 2)
    private BigDecimal dailyPrice = BigDecimal.ZERO;

    @Column(name = "km_extra_price", precision = 15, scale = 2)
    private BigDecimal kmExtraPrice = BigDecimal.ZERO;

    @Column(name = "start_validity", nullable = false)
    private LocalDate startValidity;

    @Column(name = "end_validity")
    private LocalDate endValidity;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
