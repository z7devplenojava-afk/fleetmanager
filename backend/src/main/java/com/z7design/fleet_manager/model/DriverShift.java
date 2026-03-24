package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Turno do motorista — representa a jornada de trabalho de um motorista em um dia específico.
 * O turno é personalizável: horário de início/fim, pausas, e pode conter múltiplas rotas.
 * O sistema calcula o tempo restante para possibilitar realocação dinâmica.
 */
@Entity
@Table(name = "driver_shifts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DriverShift {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Driver driver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Vehicle vehicle;

    /** Data do turno */
    @Column(name = "shift_date", nullable = false)
    private LocalDate shiftDate;

    /** Horário programado de início do turno */
    @Column(name = "planned_start_time", nullable = false)
    private LocalTime plannedStartTime;

    /** Horário programado de término do turno */
    @Column(name = "planned_end_time", nullable = false)
    private LocalTime plannedEndTime;

    /** Horário real de início (quando o motorista efetivamente começou) */
    @Column(name = "actual_start_time")
    private LocalTime actualStartTime;

    /** Horário real de término */
    @Column(name = "actual_end_time")
    private LocalTime actualEndTime;

    /** Início do intervalo/pausa */
    @Column(name = "break_start_time")
    private LocalTime breakStartTime;

    /** Fim do intervalo/pausa */
    @Column(name = "break_end_time")
    private LocalTime breakEndTime;

    /** Horas totais do turno (calculado: plannedEnd - plannedStart - pausa) */
    @Column(name = "total_shift_hours")
    private Double totalShiftHours;

    /** Horas já utilizadas em rotas executadas */
    @Column(name = "hours_used")
    private Double hoursUsed;

    /** Horas restantes disponíveis para realocação */
    @Column(name = "hours_remaining")
    private Double hoursRemaining;

    /** Localização atual do motorista (latitude) */
    @Column(name = "current_latitude")
    private Double currentLatitude;

    /** Localização atual do motorista (longitude) */
    @Column(name = "current_longitude")
    private Double currentLongitude;

    /** Nome do local atual (ex: "Garagem Central", "Rota X - Ponto 3") */
    @Column(name = "current_location_name", length = 200)
    private String currentLocationName;

    /** Status do turno */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private DriverShiftStatus status = DriverShiftStatus.SCHEDULED;

    /** Observações do turno */
    @Column(length = 1000)
    private String observations;

    /** Indica se o motorista está disponível para realocação */
    @Column(name = "available_for_reallocation", nullable = false)
    @Builder.Default
    private boolean availableForReallocation = false;

    /** Execuções de rotas dentro deste turno */
    @OneToMany(mappedBy = "driverShift", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("plannedStartTime ASC")
    @JsonManagedReference("shift-executions")
    @Builder.Default
    private List<RouteExecution> routeExecutions = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    /**
     * Calcula as horas totais do turno, descontando a pausa.
     */
    public void calculateTotalHours() {
        if (plannedStartTime != null && plannedEndTime != null) {
            long totalMinutes = Duration.between(plannedStartTime, plannedEndTime).toMinutes();
            if (breakStartTime != null && breakEndTime != null) {
                totalMinutes -= Duration.between(breakStartTime, breakEndTime).toMinutes();
            }
            this.totalShiftHours = totalMinutes / 60.0;
        }
    }

    /**
     * Recalcula horas usadas e restantes com base nas execuções de rota.
     */
    public void recalculateAvailability() {
        calculateTotalHours();
        double used = 0;
        if (routeExecutions != null) {
            for (RouteExecution exec : routeExecutions) {
                if (exec.getActualDurationMinutes() != null) {
                    used += exec.getActualDurationMinutes() / 60.0;
                } else if (exec.getEstimatedDurationMinutes() != null) {
                    used += exec.getEstimatedDurationMinutes() / 60.0;
                }
            }
        }
        this.hoursUsed = used;
        this.hoursRemaining = (totalShiftHours != null ? totalShiftHours : 0) - used;
        // Disponível para realocação se tem horas sobrando e já terminou as rotas atuais
        boolean allRoutesCompleted = routeExecutions != null && routeExecutions.stream()
                .allMatch(e -> e.getStatus() == RouteExecutionStatus.COMPLETED
                        || e.getStatus() == RouteExecutionStatus.CANCELLED);
        this.availableForReallocation = this.hoursRemaining > 0.25 && allRoutesCompleted
                && this.status == DriverShiftStatus.IN_PROGRESS;
    }

    public enum DriverShiftStatus {
        SCHEDULED,      // Turno agendado
        IN_PROGRESS,    // Motorista em serviço
        ON_BREAK,       // No intervalo
        AVAILABLE,      // Disponível para realocação (terminou rotas, tem horas sobrando)
        COMPLETED,      // Turno finalizado
        CANCELLED       // Cancelado
    }
}
