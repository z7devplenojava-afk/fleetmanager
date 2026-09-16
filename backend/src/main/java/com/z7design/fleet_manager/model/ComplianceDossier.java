package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * PRD 1.0 - MÓDULO 4 (RF-04.4): Dossiê Mensal de Conformidade Trabalhista e SST.
 * Kit documental exigido pela contratante para liberação do pagamento —
 * anexo mandatório ao Boletim de Medição (M4 → M7).
 */
@Entity
@Table(name = "compliance_dossiers",
        uniqueConstraints = @UniqueConstraint(name = "uq_dossier_period", columnNames = {"reference_month", "client_id"}))
@Data
@EqualsAndHashCode(of = "id")
public class ComplianceDossier {

    public static final String STATUS_DRAFT = "DRAFT";
    public static final String STATUS_COMPLETE = "COMPLETE";
    public static final String STATUS_ATTACHED_TO_BM = "ATTACHED_TO_BM";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Mês de referência ('YYYY-MM') — folha do mês anterior ao BM. */
    @Column(name = "reference_month", nullable = false, length = 7)
    private String referenceMonth;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Contract contract;

    // ===== Checklist do kit mandatório =====
    /** Folha analítica e resumo da folha do mês anterior. */
    @Column(name = "payroll_summary_ok", nullable = false)
    private Boolean payrollSummaryOk = false;

    /** Comprovantes de depósito de salários. */
    @Column(name = "payroll_deposit_ok", nullable = false)
    private Boolean payrollDepositOk = false;

    /** Comprovantes de benefícios (Ticket e Plano de Saúde). */
    @Column(name = "benefits_proof_ok", nullable = false)
    private Boolean benefitsProofOk = false;

    /** Guia de FGTS + Comprovante de Pagamento. */
    @Column(name = "fgts_guide_ok", nullable = false)
    private Boolean fgtsGuideOk = false;

    /** Guia de GPS/INSS + Comprovante de Pagamento. */
    @Column(name = "inss_guide_ok", nullable = false)
    private Boolean inssGuideOk = false;

    /** Certidão CNDT válida. */
    @Column(name = "cndt_ok", nullable = false)
    private Boolean cndtOk = false;

    /** CND FGTS válida. */
    @Column(name = "cnd_fgts_ok", nullable = false)
    private Boolean cndFgtsOk = false;

    /** CND Conjunta da União válida. */
    @Column(name = "cnd_union_ok", nullable = false)
    private Boolean cndUnionOk = false;

    /** Laudos de Fumaça Preta do mês (100% da frota). */
    @Column(name = "opacity_tests_ok", nullable = false)
    private Boolean opacityTestsOk = false;

    /** Metadados das evidências anexadas (JSON: item → url). */
    @Column(name = "attachments", columnDefinition = "TEXT")
    private String attachments;

    // ===== Validade das certidões =====
    @Column(name = "cndt_valid_until")
    private LocalDate cndtValidUntil;

    @Column(name = "cnd_fgts_valid_until")
    private LocalDate cndFgtsValidUntil;

    @Column(name = "cnd_union_valid_until")
    private LocalDate cndUnionValidUntil;

    // ===== Geração =====
    @Column(name = "generated_at")
    private LocalDateTime generatedAt;

    @Column(name = "generated_by", length = 255)
    private String generatedBy;

    @Column(name = "status", nullable = false, length = 30)
    private String status = STATUS_DRAFT;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** true se todos os itens mandatórios do kit estão marcados como OK. */
    public boolean isComplete() {
        return Boolean.TRUE.equals(payrollSummaryOk)
                && Boolean.TRUE.equals(payrollDepositOk)
                && Boolean.TRUE.equals(benefitsProofOk)
                && Boolean.TRUE.equals(fgtsGuideOk)
                && Boolean.TRUE.equals(inssGuideOk)
                && Boolean.TRUE.equals(cndtOk)
                && Boolean.TRUE.equals(cndFgtsOk)
                && Boolean.TRUE.equals(cndUnionOk)
                && Boolean.TRUE.equals(opacityTestsOk);
    }
}
