package com.z7design.fleet_manager.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.z7design.fleet_manager.model.enums.DailySummaryStatus;

@Data
@Entity
@Table(name = "daily_summaries", uniqueConstraints = @UniqueConstraint(columnNames = { "employee_id",
        "reference_date" }), indexes = {
                @Index(name = "idx_daily_summaries_date", columnList = "reference_date"),
                @Index(name = "idx_daily_summaries_status", columnList = "status"),
                @Index(name = "idx_daily_summaries_closed", columnList = "closed")
        })
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class DailySummary {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Employee employee;

    @Column(name = "reference_date", nullable = false)
    private LocalDate referenceDate;

    // Dados Calculados (em minutos)
    @Column(name = "expected_hours")
    private Integer expectedHours;

    @Column(name = "worked_hours")
    private Integer workedHours;

    @Column(name = "balance_hours")
    private Integer balanceHours;

    @Column(name = "night_shift_minutes")
    private Integer nightShiftMinutes = 0;

    @Column(name = "extra_50_minutes")
    private Integer extra50Minutes = 0;

    @Column(name = "extra_100_minutes")
    private Integer extra100Minutes = 0;

    // Status
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private DailySummaryStatus status;

    @Column(name = "is_holiday")
    private Boolean isHoliday = false;

    @Column(name = "is_day_off")
    private Boolean isDayOff = false;

    @Column(nullable = false)
    private Boolean closed = false;

    @Column(name = "calculated_at")
    private LocalDateTime calculatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Company company;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
