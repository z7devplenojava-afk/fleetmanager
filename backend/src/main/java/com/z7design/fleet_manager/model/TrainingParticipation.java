package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.TrainingStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade que representa a participaÃ§Ã£o em treinamentos SST
 */
@Entity
@Table(name = "training_participations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingParticipation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull(message = "FuncionÃ¡rio Ã© obrigatÃ³rio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @NotNull(message = "Treinamento Ã© obrigatÃ³rio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "training_id", nullable = false)
    private SSTTraining training;

    @NotNull(message = "Data de participaÃ§Ã£o Ã© obrigatÃ³ria")
    @Column(name = "participation_date", nullable = false)
    private LocalDate participationDate;

    @Column(name = "completion_date")
    private LocalDate completionDate;

    @NotNull(message = "Status Ã© obrigatÃ³rio")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TrainingStatus status = TrainingStatus.AGENDADO;

    @Column(precision = 5, scale = 2)
    private BigDecimal score; // Nota obtida (se aplicÃ¡vel)

    @Column(name = "certificate_number")
    private String certificateNumber;

    @Column(name = "certificate_url")
    private String certificateUrl; // URL do certificado digitalizado

    @Column(name = "instructor_name")
    private String instructorName;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}

