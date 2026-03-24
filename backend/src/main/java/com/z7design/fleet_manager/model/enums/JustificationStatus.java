package com.z7design.fleet_manager.model.enums;

public enum JustificationStatus {
    PENDING("Pendente"),
    APPROVED("Aprovado"),
    REJECTED("Rejeitado");

    private final String description;

    JustificationStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
