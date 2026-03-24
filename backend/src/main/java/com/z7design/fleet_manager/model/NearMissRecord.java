package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.AccidentStatus;
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
import java.time.LocalTime;
import java.util.UUID;

/**
 * Entidade que representa o registro de quase-acidentes
 */
@Entity
@Table(name = "near_miss_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NearMissRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull(message = "FuncionÃ¡rio Ã© obrigatÃ³rio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @NotNull(message = "Data do incidente Ã© obrigatÃ³ria")
    @Column(name = "incident_date", nullable = false)
    private LocalDate incidentDate;

    @Column(name = "incident_time")
    private LocalTime incidentTime;

    @NotBlank(message = "Local do incidente Ã© obrigatÃ³rio")
    @Column(nullable = false)
    private String location;

    @NotBlank(message = "DescriÃ§Ã£o do incidente Ã© obrigatÃ³ria")
    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "potential_consequences", columnDefinition = "TEXT")
    private String potentialConsequences;

    @Column(name = "immediate_causes", columnDefinition = "TEXT")
    private String immediateCauses;

    @Column(name = "root_causes", columnDefinition = "TEXT")
    private String rootCauses;

    @Column(name = "corrective_actions", columnDefinition = "TEXT")
    private String correctiveActions;

    @Column(name = "preventive_actions", columnDefinition = "TEXT")
    private String preventiveActions;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by_user_id")
    private User reportedByUser;

    @NotNull(message = "Status Ã© obrigatÃ³rio")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AccidentStatus status = AccidentStatus.REGISTRADO;

    @Column(name = "photos_urls", columnDefinition = "TEXT[]")
    private String[] photosUrls;

    @Column(name = "documents_urls", columnDefinition = "TEXT[]")
    private String[] documentsUrls;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}

