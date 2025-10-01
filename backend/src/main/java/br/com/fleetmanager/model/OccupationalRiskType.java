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

import br.com.fleetmanager.model.enums.OccupationalRiskCategory;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade que representa os tipos de riscos ocupacionais
 * conforme NR-15 e NR-16
 */
@Entity
@Table(name = "occupational_risk_types")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OccupationalRiskType {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank(message = "Nome do risco é obrigatório")
    @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
    @Column(nullable = false, unique = true)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull(message = "Categoria do risco é obrigatória")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OccupationalRiskCategory category;

    @NotNull(message = "Nível de severidade é obrigatório")
    @Column(nullable = false)
    private Integer severityLevel; // 1=Baixo, 2=Médio, 3=Alto, 4=Crítico

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
