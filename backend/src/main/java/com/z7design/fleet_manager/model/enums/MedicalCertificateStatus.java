package com.z7design.fleet_manager.model.enums;

import lombok.Getter;

@Getter
public enum MedicalCertificateStatus {
    APROVADO("Aprovado"),
    PENDENTE("Pendente"),
    REJEITADO("Rejeitado"),
    CANCELADO("Cancelado");

    private final String description;

    MedicalCertificateStatus(String description) {
        this.description = description;
    }
}
