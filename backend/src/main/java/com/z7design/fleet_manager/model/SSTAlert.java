package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.SSTAlertType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade que representa os alertas do sistema SST
 */
@Entity
@Table(name = "sst_alerts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SSTAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull(message = "Tipo de alerta Ã© obrigatÃ³rio")
    @Enumerated(EnumType.STRING)
    @Column(name = "alert_type", nullable = false)
    private SSTAlertType alertType;

    @NotBlank(message = "TÃ­tulo Ã© obrigatÃ³rio")
    @Column(nullable = false)
    private String title;

    @NotBlank(message = "Mensagem Ã© obrigatÃ³ria")
    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @Column(name = "related_entity_type")
    private String relatedEntityType; // EPI_DELIVERY, MEDICAL_EXAM, TRAINING_PARTICIPATION, etc.

    @Column(name = "related_entity_id")
    private UUID relatedEntityId;

    @NotNull(message = "Prioridade Ã© obrigatÃ³ria")
    @Column(nullable = false)
    @Builder.Default
    private Integer priority = 2; // 1=Baixa, 2=MÃ©dia, 3=Alta, 4=CrÃ­tica

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Builder.Default
    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Builder.Default
    @Column(name = "is_resolved", nullable = false)
    private Boolean isResolved = false;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by_user_id")
    private User resolvedByUser;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}

