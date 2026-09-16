package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.ContractTemplateType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * PRD 1.0 - MÓDULO 2: modelo contratual parametrizável (RF-02.1) com cláusulas
 * obrigatórias (RF-02.2). O corpo usa placeholders {{variavel}} preenchidos na
 * geração da minuta a partir da precificação aprovada no Módulo 1.
 */
@Entity
@Table(name = "contract_templates")
@Data
@EqualsAndHashCode(of = "id")
public class ContractTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "template_type", nullable = false, length = 50)
    private ContractTemplateType templateType;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /** Corpo da minuta com placeholders {{variavel}}. */
    @Column(name = "body", nullable = false, columnDefinition = "TEXT")
    private String body;

    // ===== Cláusulas obrigatórias (RF-02.2) =====
    /** Reajuste anual indexado ao IGP-M ou IPCA. */
    @Column(name = "adjustment_clause", columnDefinition = "TEXT")
    private String adjustmentClause;

    /** Gatilho de reequilíbrio econômico-financeiro para aumentos do diesel superiores a 5%. */
    @Column(name = "diesel_trigger_clause", columnDefinition = "TEXT")
    private String dieselTriggerClause;

    /** Pagamento normal da locação em dias parados para manutenção preventiva programada. */
    @Column(name = "pmp_payment_clause", columnDefinition = "TEXT")
    private String pmpPaymentClause;

    /** Prazos de medição (fechamento dia 20, aprovação 5 dias úteis, pagamento 15-30 dias). */
    @Column(name = "measurement_clause", columnDefinition = "TEXT")
    private String measurementClause;

    /** Retenção técnica de caução e regras de liberação. */
    @Column(name = "retention_clause", columnDefinition = "TEXT")
    private String retentionClause;

    // ===== Parâmetros padrão =====
    @Column(name = "default_retention_pct", precision = 6, scale = 4)
    private BigDecimal defaultRetentionPct = new BigDecimal("0.0300");

    @Column(name = "default_adjustment_index", length = 20)
    private String defaultAdjustmentIndex = "IGP-M";

    @Column(name = "default_payment_days")
    private Integer defaultPaymentDays = 30;

    @Column(name = "diesel_trigger_pct", precision = 6, scale = 4)
    private BigDecimal dieselTriggerPct = new BigDecimal("0.0500");

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
