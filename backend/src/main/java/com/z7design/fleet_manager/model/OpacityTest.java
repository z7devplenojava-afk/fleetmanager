package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * PRD 1.0 - MÓDULO 4 (RF-04.3): Laudo de Fumaça Preta / Opacidade.
 * Agendamento e registro mensal da medição (Escala Ringelmann) para 100%
 * dos veículos em operação na mina.
 */
@Entity
@Table(name = "opacity_tests",
        uniqueConstraints = @UniqueConstraint(name = "uq_opacity_vehicle_month", columnNames = {"vehicle_id", "test_date"}))
@Data
@EqualsAndHashCode(of = "id")
public class OpacityTest {

    /** Escala Ringelmann: 0 (sem fumaça) a 5 (fumaça densa). PRD: aprovação exige ≤ 2. */
    public static final int RINGELMANN_APPROVED_MAX = 2;
    public static final int RINGELMANN_RESTRICTED = 3;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "test_date", nullable = false)
    private LocalDate testDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Vehicle vehicle;

    @Column(name = "vehicle_plate", nullable = false, length = 20)
    private String vehiclePlate;

    @Column(name = "ringelmann_scale", nullable = false)
    private Integer ringelmannScale;

    /** APPROVED, RESTRICTED, DISAPPROVED — derivado da escala. */
    @Column(name = "result", nullable = false, length = 20)
    private String result;

    @Column(name = "laboratory_name", length = 255)
    private String laboratoryName;

    @Column(name = "certificate_number", length = 100)
    private String certificateNumber;

    @Column(name = "certificate_expires_at")
    private LocalDate certificateExpiresAt;

    @Column(name = "report_url", columnDefinition = "TEXT")
    private String reportUrl;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "company_id")
    private UUID companyId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void computeResult() {
        if (ringelmannScale != null) {
            if (ringelmannScale <= RINGELMANN_APPROVED_MAX) {
                this.result = "APPROVED";
            } else if (ringelmannScale == RINGELMANN_RESTRICTED) {
                this.result = "RESTRICTED";
            } else {
                this.result = "DISAPPROVED";
            }
        }
    }

    public boolean isApproved() {
        return "APPROVED".equals(this.result);
    }
}
