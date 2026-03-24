package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "contract_payroll_config", uniqueConstraints = @UniqueConstraint(columnNames = "contract_id"))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContractPayrollConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false, unique = true)
    private Contract contract;

    @Column(name = "hour_divisor", precision = 5, scale = 2)
    private BigDecimal hourDivisor = BigDecimal.valueOf(220.0); // Horas/mÃªs esperadas

    @Column(name = "daily_hours", precision = 4, scale = 2)
    private BigDecimal dailyHours = BigDecimal.valueOf(8.0); // Horas/dia padrÃ£o

    @Column(name = "night_shift_start")
    private LocalTime nightShiftStart = LocalTime.of(22, 0);

    @Column(name = "night_shift_end")
    private LocalTime nightShiftEnd = LocalTime.of(5, 0);

    @Column(name = "night_shift_percentage", precision = 5, scale = 2)
    private BigDecimal nightShiftPercentage = BigDecimal.valueOf(20.0); // 20%

    @Column(name = "overtime_50_percentage", precision = 5, scale = 2)
    private BigDecimal overtime50Percentage = BigDecimal.valueOf(50.0); // 50%

    @Column(name = "overtime_100_percentage", precision = 5, scale = 2)
    private BigDecimal overtime100Percentage = BigDecimal.valueOf(100.0); // 100%

    @Column(name = "sunday_overtime_percentage", precision = 5, scale = 2)
    private BigDecimal sundayOvertimePercentage = BigDecimal.valueOf(100.0); // 100%

    @Column(name = "holiday_overtime_percentage", precision = 5, scale = 2)
    private BigDecimal holidayOvertimePercentage = BigDecimal.valueOf(100.0); // 100%

    @Column(name = "delay_tolerance_minutes")
    private Integer delayToleranceMinutes = 10;

    @Column(name = "bank_hours_enabled")
    private Boolean bankHoursEnabled = false;

    @Column(name = "default_entry_time")
    private LocalTime defaultEntryTime = LocalTime.of(8, 0);

    @Column(name = "default_exit_time")
    private LocalTime defaultExitTime = LocalTime.of(17, 0);

    @Column(name = "lunch_duration_minutes")
    private Integer lunchDurationMinutes = 60;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}






