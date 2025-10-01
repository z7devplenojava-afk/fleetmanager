package br.com.fleetmanager.model.enums;

public enum LeadStatus {
    NEW("Novo"),
    CONTACTED("Contactado"),
    QUALIFIED("Qualificado"),
    PROPOSAL_SENT("Proposta Enviada"),
    NEGOTIATION("Em Negociação"),
    WON("Ganho"),
    LOST("Perdido"),
    INACTIVE("Inativo");

    private final String displayName;

    LeadStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
} 