package com.z7design.fleet_manager.model.enums;

/**
 * Status dos exames mÃ©dicos
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

