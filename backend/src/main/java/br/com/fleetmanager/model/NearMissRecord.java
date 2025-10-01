package br.com.fleetmanager.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import br.com.fleetmanager.model.enums.AccidentStatus;

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

    @NotNull(message = "Funcionário é obrigatório")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @NotNull(message = "Data do incidente é obrigatória")
    @Column(name = "incident_date", nullable = false)
    private LocalDate incidentDate;

    @Column(name = "incident_time")
    private LocalTime incidentTime;

    @NotBlank(message = "Local do incidente é obrigatório")
    @Column(nullable = false)
    private String location;

    @NotBlank(message = "Descrição do incidente é obrigatória")
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

    @NotNull(message = "Status é obrigatório")
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
