package br.com.fleetmanager.model.enums;

/**
 * Resultados dos exames médicos
 */
public enum MedicalExamResult {
    APTO("Apto"),
    INAPTO("Inapto"),
    APTO_COM_RESTRICOES("Apto com Restrições");

    private final String description;

    MedicalExamResult(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
