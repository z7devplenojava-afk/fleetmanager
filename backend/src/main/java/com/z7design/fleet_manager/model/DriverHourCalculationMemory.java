package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "driver_hour_calculation_memories")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverHourCalculationMemory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_work_hour_id", nullable = false)
    private DriverWorkHour driverWorkHour;

    @Column(name = "calculation_log", columnDefinition = "TEXT")
    private String calculationLog;

    @Column(name = "applied_rules", columnDefinition = "TEXT")
    private String appliedRules;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
