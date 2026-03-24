package com.z7design.fleet_manager.model;

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
 * Entidade que representa aÃ§Ãµes corretivas pendentes
 */
@Entity
@Table(name = "corrective_actions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CorrectiveAction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank(message = "TÃ­tulo Ã© obrigatÃ³rio")
    @Column(nullable = false)
    private String title;

    @NotBlank(message = "DescriÃ§Ã£o Ã© obrigatÃ³ria")
    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @NotNull(message = "Origem Ã© obrigatÃ³ria")
    @Column(nullable = false)
    private String origin; // INSPECAO, ACIDENTE, AUDITORIA, NAO_CONFORMIDADE, OUTROS

    @NotNull(message = "Prioridade Ã© obrigatÃ³ria")
    @Column(nullable = false)
    private String priority; // BAIXA, MEDIA, ALTA, CRITICA

    @NotNull(message = "Status Ã© obrigatÃ³rio")
    @Column(nullable = false)
    @Builder.Default
    private String status = "PENDENTE"; // PENDENTE, EM_ANDAMENTO, CONCLUIDA, CANCELADA

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_user_id")
    private User responsibleUser;

    @Column(name = "responsible_name")
    private String responsibleName; // Nome do responsÃ¡vel (para casos onde nÃ£o hÃ¡ User)

    @NotNull(message = "Data de vencimento Ã© obrigatÃ³ria")
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "completion_date")
    private LocalDate completionDate;

    @Column(name = "department")
    private String department;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_inspection_id")
    private SafetyInspection relatedInspection;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_accident_id")
    private AccidentRecord relatedAccident;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_non_conformity_id")
    private NonConformity relatedNonConformity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdByUser;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}





