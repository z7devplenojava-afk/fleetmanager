package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import org.hibernate.annotations.Filter;
import com.z7design.fleet_manager.tenant.TenantAware;
import com.z7design.fleet_manager.tenant.TenantEntityListener;

@Entity
@Table(name = "risk_assessments")
@EntityListeners(TenantEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class RiskAssessment implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "vehicle_id")
    private UUID vehicleId;

    @Column(name = "vehicle_plate")
    private String vehiclePlate;

    @Column(name = "equipment_tag")
    private String equipmentTag;

    @Column(name = "company_name")
    private String companyName;

    @Column
    private String department;

    @Column
    private String brand;

    @Column
    private String model;

    @Column(name = "power_hp")
    private Integer powerHp;

    @Column(name = "pbt_kg")
    private Integer pbtKg;

    @Column(name = "energy_type")
    private String energyType;

    @Column(name = "usage_context", columnDefinition = "TEXT")
    private String usageContext;

    @Column(name = "assessment_date", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate assessmentDate;

    @Column(name = "revision_number")
    private Integer revisionNumber = 1;

    @Column(name = "technical_responsible_name")
    private String technicalResponsibleName;

    @Column(name = "technical_responsible_crea")
    private String technicalResponsibleCrea;

    @Column(name = "normative_references", columnDefinition = "TEXT")
    private String normativeReferences;

    @Column
    private String methodology = "HRN";

    // Parâmetros HRN (LO x FE x DPH x NP)
    @Column(name = "lo_value", precision = 8, scale = 2)
    private BigDecimal loValue;

    @Column(name = "fe_value", precision = 8, scale = 2)
    private BigDecimal feValue;

    @Column(name = "dph_value", precision = 8, scale = 2)
    private BigDecimal dphValue;

    @Column(name = "np_value", precision = 8, scale = 2)
    private BigDecimal npValue;

    @Column(name = "hrn_score", precision = 10, scale = 2)
    private BigDecimal hrnScore;

    @Column(name = "risk_classification")
    private String riskClassification; // INSIGNIFICANTE, BAIXO, MEDIO, ALTO, MUITO_ALTO, EXTREMO

    @Column(name = "identified_risks", columnDefinition = "TEXT")
    private String identifiedRisks;

    @Column(name = "applied_controls", columnDefinition = "TEXT")
    private String appliedControls;

    @Column(columnDefinition = "TEXT")
    private String evidences;

    @Column(columnDefinition = "TEXT")
    private String conclusion;

    @Column(name = "technical_signature", columnDefinition = "TEXT")
    private String technicalSignature;

    @Column(name = "supervisor_signature", columnDefinition = "TEXT")
    private String supervisorSignature;

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
        calculateHrn();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        calculateHrn();
    }

    public void calculateHrn() {
        if (loValue != null && feValue != null && dphValue != null && npValue != null) {
            this.hrnScore = loValue.multiply(feValue).multiply(dphValue).multiply(npValue);
            double score = this.hrnScore.doubleValue();
            if (score <= 1) {
                this.riskClassification = "INSIGNIFICANTE";
            } else if (score <= 5) {
                this.riskClassification = "BAIXO";
            } else if (score <= 50) {
                this.riskClassification = "MEDIO";
            } else if (score <= 500) {
                this.riskClassification = "ALTO";
            } else if (score <= 1500) {
                this.riskClassification = "MUITO_ALTO";
            } else {
                this.riskClassification = "EXTREMO";
            }
        }
    }
}
