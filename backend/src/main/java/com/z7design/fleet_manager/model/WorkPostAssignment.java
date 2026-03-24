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
 * Modelo para gerenciar atribuiÃ§Ãµes de funcionÃ¡rios a postos especÃ­ficos
 * Implementa o controle manual dos quadros operacionais
 */
@Entity
@Table(name = "work_post_assignments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkPostAssignment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_post_id", nullable = false)
    private WorkPost workPost;
    
    @Column(name = "assignment_date", nullable = false)
    private LocalDate assignmentDate;
    
    @Column(name = "start_time")
    private LocalTime startTime;
    
    @Column(name = "end_time")
    private LocalTime endTime;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "shift_type", nullable = false)
    private ShiftType shiftType;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private AssignmentStatus status;
    
    @Column(name = "is_primary_assignment", nullable = false)
    @Builder.Default
    private Boolean isPrimaryAssignment = true;
    
    @Column(name = "is_backup_assignment", nullable = false)
    @Builder.Default
    private Boolean isBackupAssignment = false;
    
    @Column(name = "observations", columnDefinition = "TEXT")
    private String observations;
    
    @Column(name = "special_instructions", columnDefinition = "TEXT")
    private String specialInstructions;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by")
    private User assignedBy;
    
    @Column(name = "assignment_date_time")
    private LocalDateTime assignmentDateTime;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    public enum ShiftType {
        DAY,           // Diurno
        NIGHT,         // Noturno
        MIXED,         // Misto
        NOTURNO,       // Noturno (conforme quadro)
        MORNING,       // Matutino
        AFTERNOON,     // Vespertino
        EXTENDED       // Estendido
    }
    
    public enum AssignmentStatus {
        PENDING,       // Pendente
        CONFIRMED,     // Confirmada
        ACTIVE,        // Ativa
        COMPLETED,     // ConcluÃ­da
        CANCELLED,     // Cancelada
        MODIFIED       // Modificada
    }
}

