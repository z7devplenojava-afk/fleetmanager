package com.z7design.fleet_manager.model.enums;

public enum QuoteStatus {
    DRAFT("Rascunho"),
    SENT("Enviado"),
    UNDER_REVIEW("Em AnÃ¡lise"),
    APPROVED("Aprovado"),
    REJECTED("Rejeitado"),
    EXPIRED("Expirado"),
    CONVERTED("Convertido em Proposta");

    private final String displayName;

    QuoteStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
} 
