package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Modelo para gerenciar faltas dos funcionÃ¡rios
 * Implementa o controle manual que estÃ¡ sendo feito nos quadros
 */
import com.z7design.fleet_manager.tenant.TenantAware;
import org.hibernate.annotations.Filter;

@Entity
@Table(name = "absences")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class Absence implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "absence_date", nullable = false)
    private LocalDate absenceDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "absence_type", nullable = false)
    private AbsenceType absenceType;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "medical_certificate_days")
    private Integer medicalCertificateDays;

    @Column(name = "document_url")
    private String documentUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private AbsenceStatus status;

    @Column(name = "is_justified", nullable = false)
    @Builder.Default
    private Boolean isJustified = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "approval_date")
    private LocalDateTime approvalDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coverage_employee_id")
    private Employee coverageEmployee;

    @Column(name = "coverage_notes", columnDefinition = "TEXT")
    private String coverageNotes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "company_id")
    private UUID companyId;

    public enum AbsenceType {
        SICK_LEAVE, // Atestado mÃ©dico
        PERSONAL_LEAVE, // Falta pessoal
        UNAUTHORIZED, // Falta nÃ£o autorizada
        MEDICAL_APPOINTMENT, // Consulta mÃ©dica
        FAMILY_EMERGENCY, // EmergÃªncia familiar
        WEDDING, // Casamento
        OTHER // Outros
    }

    public enum AbsenceStatus {
        PENDING, // Pendente
        APPROVED, // Aprovada
        REJECTED, // Rejeitada
        CANCELLED // Cancelada
    }
}
