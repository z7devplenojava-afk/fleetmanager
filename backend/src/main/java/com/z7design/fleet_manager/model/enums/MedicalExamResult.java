package com.z7design.fleet_manager.model.enums;

/**
 * Resultados dos exames mÃ©dicos
 */
public enum MedicalExamResult {
    APTO("Apto"),
    INAPTO("Inapto"),
    APTO_COM_RESTRICOES("Apto com RestriÃ§Ãµes");

    private final String description;

    MedicalExamResult(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}

