package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.z7design.fleet_manager.model.enums.MedicalCertificateStatus;
import com.z7design.fleet_manager.model.enums.MedicalCertificateType;
import com.z7design.fleet_manager.tenant.TenantAware;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "medical_certificates")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Filter(name = "tenantFilter", condition = "(company_id = :companyId OR company_id IS NULL)")
public class MedicalCertificate implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull(message = "Funcionário é obrigatório")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "photos", "documents", "certifications"})
    private Employee employee;

    @Column(name = "company_id")
    private UUID companyId;

    @NotNull(message = "Tipo de atestado é obrigatório")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 60)
    private MedicalCertificateType type;

    @NotNull(message = "Data inicial é obrigatória")
    @Column(name = "start_date", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    @NotNull(message = "Data final é obrigatória")
    @Column(name = "end_date", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;

    @Builder.Default
    @Column(name = "days_count", nullable = false)
    private Integer daysCount = 1;

    @Builder.Default
    @Column(name = "absence_hours", nullable = false, precision = 6, scale = 2)
    private BigDecimal absenceHours = BigDecimal.valueOf(8.0);

    @Builder.Default
    @Column(name = "is_partial_day", nullable = false)
    private Boolean isPartialDay = false;

    @Column(name = "cid_code", length = 20)
    private String cidCode;

    @Column(name = "cid_description", length = 500)
    private String cidDescription;

    @Column(name = "doctor_name", length = 150)
    private String doctorName;

    @Column(name = "doctor_crm", length = 50)
    private String doctorCrm;

    @Column(name = "doctor_specialty", length = 100)
    private String doctorSpecialty;

    @Column(name = "document_url", length = 500)
    private String documentUrl;

    @Column(name = "document_name", length = 255)
    private String documentName;

    @Column(name = "document_type", length = 100)
    private String documentType;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Builder.Default
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MedicalCertificateStatus status = MedicalCertificateStatus.APROVADO;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Override
    public UUID getCompanyId() {
        return companyId;
    }

    public void setCompanyId(UUID companyId) {
        this.companyId = companyId;
    }
}
