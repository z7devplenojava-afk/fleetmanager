package br.com.fleetmanager.model.enums;

public enum QuoteStatus {
    DRAFT("Rascunho"),
    SENT("Enviado"),
    UNDER_REVIEW("Em Análise"),
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