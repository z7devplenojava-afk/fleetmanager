package com.z7design.fleet_manager.model.enums;

public enum ProposalStatus {
    DRAFT("Rascunho"),
    SENT("Enviada"),
    UNDER_REVIEW("Em AnÃ¡lise"),
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
