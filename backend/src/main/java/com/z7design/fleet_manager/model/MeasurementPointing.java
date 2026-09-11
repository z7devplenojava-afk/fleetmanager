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
@Table(name = "measurement_pointings")
@Data
@EqualsAndHashCode(callSuper = false)
public class MeasurementPointing {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bulletin_id", nullable = false)
    private MeasurementBulletin bulletin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @Column(name = "vehicle_plate", nullable = false)
    private String vehiclePlate;

    @Column(name = "vehicle_model")
    private String vehicleModel;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "days_expected", precision = 6, scale = 2)
    private BigDecimal daysExpected = new BigDecimal("30.00");

    @Column(name = "days_worked", precision = 6, scale = 2)
    private BigDecimal daysWorked = BigDecimal.ZERO;

    @Column(name = "days_stopped", precision = 6, scale = 2)
    private BigDecimal daysStopped = BigDecimal.ZERO;

    @Column(name = "stop_reason")
    private String stopReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
