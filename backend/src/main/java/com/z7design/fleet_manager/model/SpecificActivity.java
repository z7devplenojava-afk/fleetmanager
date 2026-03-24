package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Modelo para gerenciar atividades especÃ­ficas dos funcionÃ¡rios
 * Implementa atividades como limpeza, poda, reciclagem, etc.
 */
@Entity
@Table(name = "specific_activities")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpecificActivity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "activity_type", nullable = false)
    private ActivityType activityType;
    
    @Column(name = "activity_date", nullable = false)
    private LocalDate activityDate;
    
    @Column(name = "start_time")
    private LocalTime startTime;
    
    @Column(name = "end_time")
    private LocalTime endTime;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    private WorkPost location;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "observations", columnDefinition = "TEXT")
    private String observations;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ActivityStatus status;
    
    @Column(name = "is_completed", nullable = false)
    @Builder.Default
    private Boolean isCompleted = false;
    
    @Column(name = "completion_notes", columnDefinition = "TEXT")
    private String completionNotes;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by")
    private User assignedBy;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supervised_by")
    private User supervisedBy;
    
    @Column(name = "completion_date")
    private LocalDateTime completionDate;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    public enum ActivityType {
        CLEANING,           // Limpeza
        GLASS_CLEANING,     // Limpeza de vidros
        LAWN_MOWING,        // Poda da grama
        RECYCLING,          // Reciclagem
        MAINTENANCE,        // ManutenÃ§Ã£o
        SECURITY_PATROL,    // Ronda de seguranÃ§a
        EQUIPMENT_CHECK,    // VerificaÃ§Ã£o de equipamentos
        SPECIAL_EVENT,      // Evento especial
        TRAINING,           // Treinamento
        MEETING,            // ReuniÃ£o
        OTHER               // Outros
    }
    
    public enum ActivityStatus {
        SCHEDULED,      // Agendada
        IN_PROGRESS,    // Em andamento
        COMPLETED,      // ConcluÃ­da
        CANCELLED,      // Cancelada
        POSTPONED,      // Adiada
        OVERDUE         // Atrasada
    }
}

