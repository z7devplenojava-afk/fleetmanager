package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade que representa a matriz de EPIs obrigatÃ³rios por tipo de risco
 */
@Entity
@Table(name = "risk_required_epis")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskRequiredEPI {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull(message = "Tipo de risco Ã© obrigatÃ³rio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "risk_type_id", nullable = false)
    private OccupationalRiskType riskType;

    @NotNull(message = "EPI Ã© obrigatÃ³rio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "epi_id", nullable = false)
    private PersonalProtectiveEquipment epi;

    @Builder.Default
    @Column(name = "is_mandatory", nullable = false)
    private Boolean isMandatory = true;

    @NotNull(message = "Quantidade Ã© obrigatÃ³ria")
    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 1;

    @Column(name = "replacement_frequency_days")
    private Integer replacementFrequencyDays; // FrequÃªncia de reposiÃ§Ã£o em dias

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}

