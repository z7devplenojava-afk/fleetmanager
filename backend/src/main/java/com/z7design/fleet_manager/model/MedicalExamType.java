package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.MedicalExamCategory;
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
 * Entidade que representa os tipos de exames mÃ©dicos conforme PCMSO
 */
@Entity
@Table(name = "medical_exam_types")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalExamType {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank(message = "Nome do exame Ã© obrigatÃ³rio")
    @Size(max = 100, message = "Nome deve ter no mÃ¡ximo 100 caracteres")
    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull(message = "Categoria do exame Ã© obrigatÃ³ria")
    @Enumerated(EnumType.STRING)
    @Column(name = "exam_category", nullable = false)
    private MedicalExamCategory examCategory;

    @Column(name = "validity_months")
    private Integer validityMonths; // Validade em meses (null = sem validade)

    @Builder.Default
    @Column(name = "is_mandatory", nullable = false)
    private Boolean isMandatory = true;

    @Column(name = "required_for_risks", columnDefinition = "TEXT[]")
    private String[] requiredForRisks; // Array de IDs de riscos que exigem este exame

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

