package br.com.fleetmanager.model.enums;

/**
 * Status dos exames médicos
 */
public enum MedicalExamStatus {
    PENDENTE("Pendente"),
    REALIZADO("Realizado"),
    ATRASADO("Atrasado"),
    CANCELADO("Cancelado");

    private final String description;

    MedicalExamStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
