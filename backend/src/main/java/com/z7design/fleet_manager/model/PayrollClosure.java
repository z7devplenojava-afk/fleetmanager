package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payroll_closures")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PayrollClosure {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "reference_month", nullable = false)
    private Integer referenceMonth;

    @Column(name = "reference_year", nullable = false)
    private Integer referenceYear;

    @Column(name = "total_hours_worked", precision = 10, scale = 2)
    private BigDecimal totalHoursWorked;

    @Column(name = "regular_hours", precision = 10, scale = 2)
    private BigDecimal regularHours;

    @Column(name = "overtime_50", precision = 10, scale = 2)
    private BigDecimal overtime50;

    @Column(name = "overtime_100", precision = 10, scale = 2)
    private BigDecimal overtime100;

    @Column(name = "night_shift_hours", precision = 10, scale = 2)
    private BigDecimal nightShiftHours;

    @Column(name = "total_delays_minutes")
    private Integer totalDelaysMinutes;

    @Column(name = "total_absences_days")
    private Integer totalAbsencesDays;

    @Column(name = "worked_days")
    private Integer workedDays;

    @Column(name = "expected_days")
    private Integer expectedDays;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private ClosureStatus status = ClosureStatus.DRAFT;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "closed_by_id")
    private UUID closedById;

    @Column(name = "observations")
    @Lob
    private String observations;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pay_period_id")
    private PayPeriod payPeriod;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum ClosureStatus {
        DRAFT,
        CLOSED,
        APPROVED,
        PROCESSED
    }
}


