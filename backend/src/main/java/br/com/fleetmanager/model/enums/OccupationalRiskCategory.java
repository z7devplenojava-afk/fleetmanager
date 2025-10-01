package br.com.fleetmanager.model.enums;

/**
 * Categorias de riscos ocupacionais conforme NR-15 e NR-16
 */
public enum OccupationalRiskCategory {
    FISICO("Físico"),
    QUIMICO("Químico"),
    BIOLOGICO("Biológico"),
    ERGONOMICO("Ergonômico"),
    ACIDENTE("Acidente");

    private final String description;

    OccupationalRiskCategory(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
