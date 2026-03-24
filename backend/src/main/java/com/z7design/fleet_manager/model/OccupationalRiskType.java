package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.OccupationalRiskCategory;
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

    @NotBlank(message = "Nome do risco Ã© obrigatÃ³rio")
    @Size(max = 100, message = "Nome deve ter no mÃ¡ximo 100 caracteres")
    @Column(nullable = false, unique = true)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull(message = "Categoria do risco Ã© obrigatÃ³ria")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OccupationalRiskCategory category;

    @NotNull(message = "NÃ­vel de severidade Ã© obrigatÃ³rio")
    @Column(nullable = false)
    private Integer severityLevel; // 1=Baixo, 2=MÃ©dio, 3=Alto, 4=CrÃ­tico

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

