package com.z7design.fleet_manager.model.enums;

import lombok.Getter;

@Getter
public enum RetentionStatus {
    RETIDO("Retido"),
    LIBERADO("Liberado / Devolvido"),
    FATURADO("Faturado"),
    CANCELADO("Cancelado");

    private final String description;

    RetentionStatus(String description) {
        this.description = description;
    }
}
