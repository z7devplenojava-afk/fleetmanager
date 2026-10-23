package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.z7design.fleet_manager.tenant.TenantAware;
import org.hibernate.annotations.Filter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "driver_work_hours")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class DriverWorkHour implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "reference_date", nullable = false)
    private LocalDate referenceDate;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    // Total em minutos para facilitar cálculos
    @Column(name = "total_minutes")
    private Integer totalMinutes;

    @Column(name = "wait_minutes")
    private Integer waitMinutes;

    @Column(name = "night_minutes")
    private Integer nightMinutes;

    @Column(name = "overtime_minutes")
    private Integer overtimeMinutes;

    // Pegadas do Motorista (1ª a 4ª com Início e Fim)
    @Column(name = "pegada1_start")
    private LocalDateTime pegada1Start;

    @Column(name = "pegada1_end")
    private LocalDateTime pegada1End;

    @Column(name = "pegada2_start")
    private LocalDateTime pegada2Start;

    @Column(name = "pegada2_end")
    private LocalDateTime pegada2End;

    @Column(name = "pegada3_start")
    private LocalDateTime pegada3Start;

    @Column(name = "pegada3_end")
    private LocalDateTime pegada3End;

    @Column(name = "pegada4_start")
    private LocalDateTime pegada4Start;

    @Column(name = "pegada4_end")
    private LocalDateTime pegada4End;

    // Hora Noturna Reduzida CLT (fator 52m30s = 1.142857)
    @Column(name = "night_reduced_minutes")
    @Builder.Default
    private Integer nightReducedMinutes = 0;

    // Carga horária prevista no contrato de trabalho (padrão 480 min = 8h)
    @Column(name = "contract_daily_minutes")
    @Builder.Default
    private Integer contractDailyMinutes = 480;

    @Column(name = "source", length = 50)
    @Builder.Default
    private String source = "MANUAL"; // PONTO, PARTE_DIARIA, HIBRIDO, MANUAL

    @Column(name = "company_id")
    private UUID companyId;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "is_closed")
    @Builder.Default
    private Boolean isClosed = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
