package com.z7design.fleet_manager.model.enums;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * PRD 1.0 - Módulo 3 (RF-03.5): ciclo de vida do bloco de Parte Diária.
 */
public enum DailyLogBookStatus {
    ACTIVE("Ativo"),
    EXHAUSTED("Esgotado"),
    CANCELLED("Cancelado"),
    LOST("Extraviado");

    private final String description;

    DailyLogBookStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    @JsonValue
    public String toValue() {
        return name();
    }
}
