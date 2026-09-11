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
@Table(name = "measurement_contract_adjustments")
@Data
@EqualsAndHashCode(callSuper = false)
public class MeasurementAdjustment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    private MeasurementContract contract;

    @Column(name = "percentage", precision = 8, scale = 4, nullable = false)
    private BigDecimal percentage;

    @Column(name = "index_name")
    private String indexName;

    @Column(name = "applied_date", nullable = false)
    private LocalDate appliedDate;

    @Column(name = "previous_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal previousAmount;

    @Column(name = "new_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal newAmount;

    @Column(name = "justification", columnDefinition = "TEXT")
    private String justification;

    @Column(name = "created_by")
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
