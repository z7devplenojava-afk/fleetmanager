package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * PRD 1.0 - MÓDULO 3 (RF-03.3): Laudo de Vistoria de Mobilização.
 * Checklist digital com fotos do veículo, estado da lataria, pneus, tacógrafo,
 * triângulo, chave de roda, alarme de ré e cópia do CRLV anexada, assinado em
 * conjunto com o cliente.
 */
@Entity
@Table(name = "mobilization_inspections")
@Data
@EqualsAndHashCode(of = "id")
public class MobilizationInspection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "registry_number", nullable = false, unique = true, length = 50)
    private String registryNumber;

    @Column(name = "inspection_date", nullable = false)
    private LocalDate inspectionDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @Column(name = "vehicle_plate", nullable = false, length = 20)
    private String vehiclePlate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    @Column(name = "client_name", length = 255)
    private String clientName;

    @Column(name = "contract_number", length = 100)
    private String contractNumber;

    @Column(name = "current_mileage")
    private Integer currentMileage;

    // ===== Checklist digital =====
    @Column(name = "bodywork_ok", nullable = false)
    private Boolean bodyworkOk = true;

    @Column(name = "bodywork_notes", columnDefinition = "TEXT")
    private String bodyworkNotes;

    @Column(name = "tires_ok", nullable = false)
    private Boolean tiresOk = true;

    @Column(name = "tires_notes", columnDefinition = "TEXT")
    private String tiresNotes;

    @Column(name = "tachograph_ok", nullable = false)
    private Boolean tachographOk = true;

    @Column(name = "warning_triangle_ok", nullable = false)
    private Boolean warningTriangleOk = true;

    @Column(name = "wheel_wrench_ok", nullable = false)
    private Boolean wheelWrenchOk = true;

    @Column(name = "reverse_alarm_ok", nullable = false)
    private Boolean reverseAlarmOk = true;

    /** Cópia do CRLV anexada. */
    @Column(name = "crlv_attached", nullable = false)
    private Boolean crlvAttached = false;

    /** URLs das fotos do veículo (separadas por vírgula). */
    @Column(name = "photos_urls", columnDefinition = "TEXT")
    private String photosUrls;

    @Column(name = "general_notes", columnDefinition = "TEXT")
    private String generalNotes;

    // ===== Assinaturas conjuntas =====
    @Column(name = "inspector_name", length = 255)
    private String inspectorName;

    @Column(name = "inspector_signature", columnDefinition = "TEXT")
    private String inspectorSignature;

    @Column(name = "client_representative_name", length = 255)
    private String clientRepresentativeName;

    @Column(name = "client_representative_signature", columnDefinition = "TEXT")
    private String clientRepresentativeSignature;

    /** Vistoria aprovada (mobilização liberada). */
    @Column(name = "approved", nullable = false)
    private Boolean approved = false;

    @Column(name = "company_id")
    private UUID companyId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
