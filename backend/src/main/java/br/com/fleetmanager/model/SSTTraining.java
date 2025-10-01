package br.com.fleetmanager.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade que representa os treinamentos em SST
 */
@Entity
@Table(name = "sst_trainings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SSTTraining {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank(message = "Nome do treinamento é obrigatório")
    @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotBlank(message = "Tipo de treinamento é obrigatório")
    @Size(max = 50, message = "Tipo deve ter no máximo 50 caracteres")
    @Column(name = "training_type", nullable = false)
    private String trainingType; // NR_35, CIPA, NR_10, BRIGADA_INCENDIO, etc.

    @NotNull(message = "Duração é obrigatória")
    @Column(name = "duration_hours", nullable = false)
    private Integer durationHours;

    @Column(name = "validity_months")
    private Integer validityMonths; // Validade em meses (null = sem validade)

    @Builder.Default
    @Column(name = "is_mandatory", nullable = false)
    private Boolean isMandatory = true;

    @Column(name = "required_for_risks", columnDefinition = "TEXT[]")
    private String[] requiredForRisks; // Array de IDs de riscos que exigem este treinamento

    @Size(max = 100, message = "Fornecedor deve ter no máximo 100 caracteres")
    private String provider;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
