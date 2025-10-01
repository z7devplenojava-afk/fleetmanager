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
import br.com.fleetmanager.model.enums.AccidentType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Entidade que representa o registro de acidentes de trabalho
 */
@Entity
@Table(name = "accident_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccidentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull(message = "Funcionário é obrigatório")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @NotNull(message = "Data do acidente é obrigatória")
    @Column(name = "accident_date", nullable = false)
    private LocalDate accidentDate;

    @Column(name = "accident_time")
    private LocalTime accidentTime;

    @NotBlank(message = "Local do acidente é obrigatório")
    @Column(nullable = false)
    private String location;

    @NotNull(message = "Tipo de acidente é obrigatório")
    @Enumerated(EnumType.STRING)
    @Column(name = "accident_type", nullable = false)
    private AccidentType accidentType;

    @NotBlank(message = "Descrição do acidente é obrigatória")
    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "injury_description", columnDefinition = "TEXT")
    private String injuryDescription;

    @Column(name = "body_parts_affected", columnDefinition = "TEXT[]")
    private String[] bodyPartsAffected; // Array de partes do corpo afetadas

    @Column(name = "immediate_causes", columnDefinition = "TEXT")
    private String immediateCauses;

    @Column(name = "root_causes", columnDefinition = "TEXT")
    private String rootCauses;

    @Column(name = "corrective_actions", columnDefinition = "TEXT")
    private String correctiveActions;

    @Column(name = "preventive_actions", columnDefinition = "TEXT")
    private String preventiveActions;

    @Column(name = "cat_number")
    private String catNumber; // Número da CAT (Comunicação de Acidente de Trabalho)

    @Column(name = "cat_issued_date")
    private LocalDate catIssuedDate;

    @Builder.Default
    @Column(name = "days_off")
    private Integer daysOff = 0;

    @Column(name = "return_to_work_date")
    private LocalDate returnToWorkDate;

    @Column(name = "witness_names", columnDefinition = "TEXT")
    private String witnessNames;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by_user_id")
    private User reportedByUser;

    @NotNull(message = "Status é obrigatório")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AccidentStatus status = AccidentStatus.REGISTRADO;

    @Column(name = "photos_urls", columnDefinition = "TEXT[]")
    private String[] photosUrls; // Array de URLs das fotos

    @Column(name = "documents_urls", columnDefinition = "TEXT[]")
    private String[] documentsUrls; // Array de URLs dos documentos

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
