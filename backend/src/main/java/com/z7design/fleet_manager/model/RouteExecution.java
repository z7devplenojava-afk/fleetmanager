package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Duration;
import java.util.UUID;

/**
 * Execução de uma rota — registra quando um motorista realmente executou uma rota.
 * Compara tempos estimados vs reais para otimizar futuras alocações.
 */
@Entity
@Table(name = "route_executions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteExecution {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Turno ao qual esta execução pertence */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_shift_id", nullable = false)
    @JsonBackReference("shift-executions")
    private DriverShift driverShift;

    /** Rota que está sendo executada */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "points"})
    private Route route;

    /** Motorista (desnormalizado para consultas rápidas) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Driver driver;

    /** Veículo utilizado */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Vehicle vehicle;

    /** Horário programado de início desta rota */
    @Column(name = "planned_start_time")
    private LocalTime plannedStartTime;

    /** Horário programado de término */
    @Column(name = "planned_end_time")
    private LocalTime plannedEndTime;

    /** Horário real de início */
    @Column(name = "actual_start_time")
    private LocalTime actualStartTime;

    /** Horário real de término */
    @Column(name = "actual_end_time")
    private LocalTime actualEndTime;

    /** Duração estimada em minutos (vindo da rota) */
    @Column(name = "estimated_duration_minutes")
    private Integer estimatedDurationMinutes;

    /** Duração real em minutos (calculada após conclusão) */
    @Column(name = "actual_duration_minutes")
    private Integer actualDurationMinutes;

    /** Diferença: negativo = terminou antes do previsto (tempo economizado) */
    @Column(name = "time_difference_minutes")
    private Integer timeDifferenceMinutes;

    /** Km estimado */
    @Column(name = "estimated_km")
    private Double estimatedKm;

    /** Km real percorrido */
    @Column(name = "actual_km")
    private Double actualKm;

    /** Indica se esta é uma realocação (rota extra atribuída por disponibilidade) */
    @Column(name = "is_reallocation", nullable = false)
    @Builder.Default
    private boolean reallocation = false;

    /** Ordem de execução dentro do turno (1ª rota, 2ª rota, etc.) */
    @Column(name = "execution_order")
    private Integer executionOrder;

    /** Status da execução */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private RouteExecutionStatus status = RouteExecutionStatus.SCHEDULED;

    /** Observações (atrasos, problemas, etc.) */
    @Column(length = 1000)
    private String observations;

    /** Latitude de início real */
    @Column(name = "start_latitude")
    private Double startLatitude;

    /** Longitude de início real */
    @Column(name = "start_longitude")
    private Double startLongitude;

    /** Latitude de fim real */
    @Column(name = "end_latitude")
    private Double endLatitude;

    /** Longitude de fim real */
    @Column(name = "end_longitude")
    private Double endLongitude;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    /**
     * Calcula a duração real e a diferença em relação ao estimado ao finalizar.
     */
    public void calculateActualDuration() {
        if (actualStartTime != null && actualEndTime != null) {
            long minutes = Duration.between(actualStartTime, actualEndTime).toMinutes();
            this.actualDurationMinutes = (int) minutes;
            if (estimatedDurationMinutes != null) {
                this.timeDifferenceMinutes = this.actualDurationMinutes - estimatedDurationMinutes;
            }
        }
    }
}
