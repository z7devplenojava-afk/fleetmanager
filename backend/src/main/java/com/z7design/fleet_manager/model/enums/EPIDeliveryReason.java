package com.z7design.fleet_manager.model.enums;

/**
 * Motivos de entrega de EPIs
 */
public enum EPIDeliveryReason {
    ADMISSAO("AdmissÃ£o"),
    REPOSICAO("ReposiÃ§Ã£o"),
    TROCA("Troca"),
    PERDA("Perda"),
    DANO("Dano");

    private final String description;

    EPIDeliveryReason(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}

