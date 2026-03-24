package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.VisitScheduleStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "visit_schedules")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisitSchedule {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @NotNull(message = "Data da escala Ã© obrigatÃ³ria")
    @Column(name = "schedule_date", nullable = false)
    private LocalDate scheduleDate;
    
    @NotNull(message = "Supervisor Ã© obrigatÃ³rio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supervisor_id", nullable = false)
    private Employee supervisor;
    
    @NotNull(message = "Cliente Ã© obrigatÃ³rio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;
    
    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;
    
    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private VisitScheduleStatus status = VisitScheduleStatus.PLANNED;
    
    @Column(name = "total_estimated_time")
    private Integer totalEstimatedTimeMinutes;
    
    @Column(name = "total_travel_distance")
    private Double totalTravelDistanceKm;
    
    @Column(name = "observations", columnDefinition = "TEXT")
    private String observations;
    
    // Rota otimizada automaticamente
    @Column(name = "optimized_route", columnDefinition = "TEXT")
    private String optimizedRoute; // JSON com a sequÃªncia otimizada de visitas
    
    @Column(name = "route_optimization_score")
    private Double routeOptimizationScore; // Score de eficiÃªncia da rota (0-100)
    
    // Lista de visitas incluÃ­das nesta escala
    @OneToMany(mappedBy = "visitSchedule", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Visit> visits = new ArrayList<>();
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // Campos para controle de execuÃ§Ã£o
    @Column(name = "started_at")
    private LocalDateTime startedAt;
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    
    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;
    
    @Column(name = "cancellation_reason")
    private String cancellationReason;
}

