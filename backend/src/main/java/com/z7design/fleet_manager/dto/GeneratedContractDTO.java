package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.GeneratedContract;
import com.z7design.fleet_manager.model.enums.ContractTemplateType;
import com.z7design.fleet_manager.model.enums.GeneratedContractStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * PRD 1.0 - Módulo 2: requisição/resposta de geração de minutas contratuais.
 */
@Data
public class GeneratedContractDTO {

    private UUID id;

    /** Obrigatório na geração. */
    private UUID templateId;

    /** Obrigatório na geração. */
    @NotNull(message = "Cliente é obrigatório")
    private UUID clientId;

    /** Simulação de custos aprovada do Módulo 1 — obrigatória na geração. */
    private UUID costSimulationId;

    private ContractTemplateType templateType;
    private String templateName;

    private String referenceNumber;
    private String title;

    private String renderedBody;
    private String renderedClauses;

    // Qualificação das partes
    private String contractorName;
    private String contractorCnpj;
    private String contractorAddress;
    private String clientName;
    private String clientCnpj;
    private String clientAddress;
    private String electedForum;

    // Dados econômicos (M1)
    private BigDecimal monthlyPrice;
    private BigDecimal franchiseKm;
    private BigDecimal excessKmRate;
    private BigDecimal dailyRate;
    private BigDecimal extraTripRate;
    private BigDecimal retentionPct;
    private String adjustmentIndex;
    private Integer paymentDays;

    // Versionamento/assinatura (RF-02.3)
    private Integer version;
    private GeneratedContractStatus status;
    private String signatureProvider;
    private LocalDateTime signedAt;

    private LocalDateTime createdAt;

    public static GeneratedContractDTO fromEntity(GeneratedContract e) {
        GeneratedContractDTO dto = new GeneratedContractDTO();
        dto.setId(e.getId());
        if (e.getTemplate() != null) {
            dto.setTemplateId(e.getTemplate().getId());
            dto.setTemplateType(e.getTemplate().getTemplateType());
            dto.setTemplateName(e.getTemplate().getName());
        }
        if (e.getClient() != null) {
            dto.setClientId(e.getClient().getId());
        }
        if (e.getCostSimulation() != null) {
            dto.setCostSimulationId(e.getCostSimulation().getId());
        }
        dto.setReferenceNumber(e.getReferenceNumber());
        dto.setTitle(e.getTitle());
        dto.setRenderedBody(e.getRenderedBody());
        dto.setRenderedClauses(e.getRenderedClauses());
        dto.setContractorName(e.getContractorName());
        dto.setContractorCnpj(e.getContractorCnpj());
        dto.setContractorAddress(e.getContractorAddress());
        dto.setClientName(e.getClientName());
        dto.setClientCnpj(e.getClientCnpj());
        dto.setClientAddress(e.getClientAddress());
        dto.setElectedForum(e.getElectedForum());
        dto.setMonthlyPrice(e.getMonthlyPrice());
        dto.setFranchiseKm(e.getFranchiseKm());
        dto.setExcessKmRate(e.getExcessKmRate());
        dto.setDailyRate(e.getDailyRate());
        dto.setExtraTripRate(e.getExtraTripRate());
        dto.setRetentionPct(e.getRetentionPct());
        dto.setAdjustmentIndex(e.getAdjustmentIndex());
        dto.setVersion(e.getVersion());
        dto.setStatus(e.getStatus());
        dto.setSignatureProvider(e.getSignatureProvider());
        dto.setSignedAt(e.getSignedAt());
        dto.setCreatedAt(e.getCreatedAt());
        return dto;
    }
}
