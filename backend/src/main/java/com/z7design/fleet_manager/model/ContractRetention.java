package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.RetentionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "contract_retentions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractRetention {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id")
    private Unit unit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private Contract contract;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "measurement_id")
    private MeasurementBulletin measurement;

    @Column(name = "reference_month", length = 20)
    private String referenceMonth;

    @Column(name = "measured_value", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal measuredValue = BigDecimal.ZERO;

    @Column(name = "rmu_discount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal rmuDiscount = BigDecimal.ZERO;

    @Column(name = "retention_rate", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal retentionRate = new BigDecimal("3.00");

    @Column(name = "retention_value", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal retentionValue = BigDecimal.ZERO;

    @Column(name = "net_invoiced_value", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal netInvoicedValue = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private RetentionStatus status = RetentionStatus.RETIDO;

    @Column(name = "expected_release_date")
    private LocalDate expectedReleaseDate;

    @Column(name = "actual_release_date")
    private LocalDate actualReleaseDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        calculateValues();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        calculateValues();
    }

    public void calculateValues() {
        if (this.measuredValue == null) {
            this.measuredValue = BigDecimal.ZERO;
        }
        if (this.rmuDiscount == null) {
            this.rmuDiscount = BigDecimal.ZERO;
        }
        if (this.retentionRate == null) {
            this.retentionRate = new BigDecimal("3.00");
        }

        // Valor Retenção = measuredValue * (retentionRate / 100)
        BigDecimal rateMultiplier = this.retentionRate.divide(new BigDecimal("100"), 4, java.math.RoundingMode.HALF_UP);
        this.retentionValue = this.measuredValue.multiply(rateMultiplier).setScale(2, java.math.RoundingMode.HALF_UP);

        // Valor a Faturar = measuredValue - rmuDiscount - retentionValue
        this.netInvoicedValue = this.measuredValue.subtract(this.rmuDiscount).subtract(this.retentionValue).setScale(2, java.math.RoundingMode.HALF_UP);
    }
}
