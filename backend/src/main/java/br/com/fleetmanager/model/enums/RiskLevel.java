package br.com.fleetmanager.model.enums;

/**
 * Níveis de risco ocupacional
 */
public enum RiskLevel {
    BAIXO("Baixo"),
    MEDIO("Médio"),
    ALTO("Alto"),
    CRITICO("Crítico");

    private final String description;

    RiskLevel(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
