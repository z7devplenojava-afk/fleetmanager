package com.z7design.fleet_manager.model.enums;

/**
 * Categorias de riscos ocupacionais conforme NR-15 e NR-16
 */
public enum OccupationalRiskCategory {
    FISICO("FÃ­sico"),
    QUIMICO("QuÃ­mico"),
    BIOLOGICO("BiolÃ³gico"),
    ERGONOMICO("ErgonÃ´mico"),
    ACIDENTE("Acidente");

    private final String description;

    OccupationalRiskCategory(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}

