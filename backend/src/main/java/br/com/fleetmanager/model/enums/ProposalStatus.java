package br.com.fleetmanager.model.enums;

public enum ProposalStatus {
    DRAFT("Rascunho"),
    SENT("Enviada"),
    UNDER_REVIEW("Em Análise"),
    APPROVED("Aprovada"),
    REJECTED("Rejeitada"),
    EXPIRED("Expirada"),
    CONVERTED("Convertida em Contrato");

    private final String displayName;

    ProposalStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
} 