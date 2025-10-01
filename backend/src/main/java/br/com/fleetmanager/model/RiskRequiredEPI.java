package br.com.fleetmanager.model;

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
 * Entidade que representa a matriz de EPIs obrigatórios por tipo de risco
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

    @NotNull(message = "Tipo de risco é obrigatório")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "risk_type_id", nullable = false)
    private OccupationalRiskType riskType;

    @NotNull(message = "EPI é obrigatório")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "epi_id", nullable = false)
    private PersonalProtectiveEquipment epi;

    @Builder.Default
    @Column(name = "is_mandatory", nullable = false)
    private Boolean isMandatory = true;

    @NotNull(message = "Quantidade é obrigatória")
    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 1;

    @Column(name = "replacement_frequency_days")
    private Integer replacementFrequencyDays; // Frequência de reposição em dias

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
