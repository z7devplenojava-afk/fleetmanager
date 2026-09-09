package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import org.hibernate.annotations.Filter;
import com.z7design.fleet_manager.tenant.TenantAware;
import com.z7design.fleet_manager.tenant.TenantEntityListener;

@Entity
@Table(name = "vehicle_inspections")
@EntityListeners(TenantEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class VehicleInspection implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "registry_number", nullable = false, unique = true)
    private String registryNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "inspection_type", nullable = false)
    private InspectionType inspectionType;

    @Column(name = "inspection_date", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate inspectionDate;

    @Column(name = "vehicle_id")
    private UUID vehicleId;

    @Column(name = "vehicle_plate")
    private String vehiclePlate;

    @Column(name = "client_name")
    private String clientName;

    @Column(name = "project_name")
    private String projectName;

    @Column(name = "current_mileage")
    private Integer currentMileage;

    @Column(name = "requester_name")
    private String requesterName;

    @Column(name = "driver_name")
    private String driverName;

    @Column(name = "anomalies_problem", columnDefinition = "TEXT")
    private String anomaliesProblem;

    @Column(name = "occurrence_description", columnDefinition = "TEXT")
    private String occurrenceDescription;

    @Column(name = "services_performed", columnDefinition = "TEXT")
    private String servicesPerformed;

    @Column(name = "parts_used", columnDefinition = "TEXT")
    private String partsUsed;

    @Column(name = "technical_parameters", columnDefinition = "TEXT")
    private String technicalParameters;

    @Column(name = "evidences_urls", columnDefinition = "TEXT")
    private String evidencesUrls;

    @Column(name = "result_notes", columnDefinition = "TEXT")
    private String resultNotes;

    // Status de Liberação do Veículo (Seção 11 PRD)
    @Enumerated(EnumType.STRING)
    @Column(name = "release_status", nullable = false)
    private VehicleReleaseStatus releaseStatus = VehicleReleaseStatus.LIBERADO_SEM_RESTRICAO;

    @Column(name = "restriction_description", columnDefinition = "TEXT")
    private String restrictionDescription;

    @Column(name = "restriction_deadline")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate restrictionDeadline;

    @Column(name = "restriction_responsible")
    private String restrictionResponsible;

    @Column(name = "definitive_release_condition", columnDefinition = "TEXT")
    private String definitiveReleaseCondition;

    @Column(name = "inspector_name")
    private String inspectorName;

    @Column(name = "supervisor_name")
    private String supervisorName;

    @Column(name = "inspector_signature", columnDefinition = "TEXT")
    private String inspectorSignature;

    @Column(name = "supervisor_signature", columnDefinition = "TEXT")
    private String supervisorSignature;

    @Column(name = "release_signature", columnDefinition = "TEXT")
    private String releaseSignature;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum InspectionType {
        LAUDO("Laudo Técnico"),
        INSPECAO_TECNICA("Inspeção Técnica"),
        VISTORIA("Vistoria Geral");

        private final String displayName;
        InspectionType(String displayName) { this.displayName = displayName; }
        public String getDisplayName() { return displayName; }
    }

    public enum VehicleReleaseStatus {
        LIBERADO_SEM_RESTRICAO("Liberado Sem Restrição"),
        LIBERADO_COM_RESTRICAO("Liberado Com Restrição"),
        NAO_LIBERADO("Não Liberado (Bloqueado)");

        private final String displayName;
        VehicleReleaseStatus(String displayName) { this.displayName = displayName; }
        public String getDisplayName() { return displayName; }
    }
}
