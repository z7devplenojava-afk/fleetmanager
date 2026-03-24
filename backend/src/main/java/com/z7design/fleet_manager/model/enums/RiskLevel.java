package com.z7design.fleet_manager.model.enums;

/**
 * NÃ­veis de risco ocupacional
 */
public enum RiskLevel {
    BAIXO("Baixo"),
    MEDIO("MÃ©dio"),
    ALTO("Alto"),
    CRITICO("CrÃ­tico");

    private final String description;

    RiskLevel(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}

