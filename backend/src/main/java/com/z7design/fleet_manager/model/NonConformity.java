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
 * Entidade que representa as nÃ£o conformidades identificadas
 */
@Entity
@Table(name = "non_conformities")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NonConformity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_id")
    private SafetyInspection inspection;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accident_id")
    private AccidentRecord accident;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "near_miss_id")
    private NearMissRecord nearMiss;

    @NotBlank(message = "TÃ­tulo Ã© obrigatÃ³rio")
    @Column(nullable = false)
    private String title;

    @NotBlank(message = "DescriÃ§Ã£o Ã© obrigatÃ³ria")
    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @NotBlank(message = "Severidade Ã© obrigatÃ³ria")
    @Column(nullable = false)
    private String severity; // BAIXA, MEDIA, ALTA, CRITICA

    @NotNull(message = "Status Ã© obrigatÃ³rio")
    @Column(nullable = false)
    @Builder.Default
    private String status = "ABERTA"; // ABERTA, EM_ANALISE, EM_CORRECAO, CORRIGIDA, FECHADA

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_user_id")
    private User responsibleUser;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "corrective_action", columnDefinition = "TEXT")
    private String correctiveAction;

    @Column(name = "preventive_action", columnDefinition = "TEXT")
    private String preventiveAction;

    @Column(name = "correction_date")
    private LocalDate correctionDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by_user_id")
    private User verifiedByUser;

    @Column(name = "verification_date")
    private LocalDate verificationDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}

