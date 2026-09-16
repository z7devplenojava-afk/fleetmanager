package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.GeneratedContractStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * PRD 1.0 - MÓDULO 2: minuta contratual gerada (RF-02.1/RF-02.3), com
 * qualificação completa das partes, dados econômicos do Módulo 1,
 * versionamento e rastreio de assinatura digital (DocuSign/Gov.br).
 */
@Entity
@Table(name = "contract_templates_generated")
@Data
@EqualsAndHashCode(of = "id")
public class GeneratedContract {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private ContractTemplate template;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    /** Simulação de custos (Módulo 1) que originou os valores econômicos. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cost_simulation_id")
    private CostSimulation costSimulation;

    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "rendered_body", nullable = false, columnDefinition = "TEXT")
    private String renderedBody;

    @Column(name = "rendered_clauses", columnDefinition = "TEXT")
    private String renderedClauses;

    // ===== Qualificação das partes =====
    @Column(name = "contractor_name", length = 255)
    private String contractorName;

    @Column(name = "contractor_cnpj", length = 30)
    private String contractorCnpj;

    @Column(name = "contractor_address", columnDefinition = "TEXT")
    private String contractorAddress;

    @Column(name = "client_name", length = 255)
    private String clientName;

    @Column(name = "client_cnpj", length = 30)
    private String clientCnpj;

    @Column(name = "client_address", columnDefinition = "TEXT")
    private String clientAddress;

    @Column(name = "elected_forum", length = 255)
    private String electedForum;

    // ===== Dados econômicos vigentes na assinatura =====
    @Column(name = "monthly_price", precision = 15, scale = 2)
    private BigDecimal monthlyPrice;

    @Column(name = "franchise_km", precision = 12, scale = 2)
    private BigDecimal franchiseKm;

    @Column(name = "excess_km_rate", precision = 10, scale = 4)
    private BigDecimal excessKmRate;

    @Column(name = "daily_rate", precision = 15, scale = 2)
    private BigDecimal dailyRate;

    @Column(name = "extra_trip_rate", precision = 15, scale = 2)
    private BigDecimal extraTripRate;

    @Column(name = "retention_pct", precision = 6, scale = 4)
    private BigDecimal retentionPct;

    @Column(name = "adjustment_index", length = 20)
    private String adjustmentIndex;

    // ===== Versionamento e assinatura (RF-02.3) =====
    @Column(name = "version", nullable = false)
    private Integer version = 1;

    @Column(name = "signature_provider", length = 50)
    private String signatureProvider;

    @Column(name = "signed_at")
    private LocalDateTime signedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private GeneratedContractStatus status = GeneratedContractStatus.DRAFT;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
