package br.com.fleetmanager.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import br.com.fleetmanager.model.enums.VisitStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "visits")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Visit {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @NotNull(message = "Data da visita é obrigatória")
    @Column(name = "visit_date", nullable = false)
    private LocalDate visitDate;
    
    @NotNull(message = "Supervisor é obrigatório")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supervisor_id", nullable = false)
    private Employee supervisor;
    
    @NotNull(message = "Setor é obrigatório")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    private Unit unit;
    
    // Referência à escala de visitas
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "visit_schedule_id")
    private VisitSchedule visitSchedule;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private VisitStatus status = VisitStatus.PENDING;
    
    @Column(name = "observations", columnDefinition = "TEXT")
    private String observations;
    
    @Column(name = "arrival_time")
    private LocalDateTime arrivalTime;
    
    @Column(name = "departure_time")
    private LocalDateTime departureTime;
    
    // Dados de checklist rápido
    @Column(name = "security_check")
    @Builder.Default
    private Boolean securityCheck = false;
    
    @Column(name = "equipment_check")
    @Builder.Default
    private Boolean equipmentCheck = false;
    
    @Column(name = "staff_check")
    @Builder.Default
    private Boolean staffCheck = false;
    
    @Column(name = "procedure_check")
    @Builder.Default
    private Boolean procedureCheck = false;
    
    // Campos para otimização de rota
    @Column(name = "estimated_duration_minutes")
    @Builder.Default
    private Integer estimatedDurationMinutes = 30; // Duração estimada da visita
    
    @Column(name = "priority_level")
    @Builder.Default
    private Integer priorityLevel = 1; // 1-5 (1=baixa, 5=alta prioridade)
    
    @Column(name = "preferred_time_start")
    private LocalDateTime preferredTimeStart; // Horário preferencial de início
    
    @Column(name = "preferred_time_end")
    private LocalDateTime preferredTimeEnd; // Horário preferencial de fim
    
    @Column(name = "route_order")
    private Integer routeOrder; // Ordem na rota otimizada
    
    @Column(name = "travel_time_to_next_minutes")
    private Integer travelTimeToNextMinutes; // Tempo de viagem para próxima visita
    
    @Column(name = "travel_distance_to_next_km")
    private Double travelDistanceToNextKm; // Distância para próxima visita
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Unique constraint para evitar múltiplas visitas no mesmo dia/setor/supervisor
    @Table(uniqueConstraints = {
        @UniqueConstraint(columnNames = {"visit_date", "supervisor_id", "unit_id"})
    })
    public static class VisitConstraints {}
}
