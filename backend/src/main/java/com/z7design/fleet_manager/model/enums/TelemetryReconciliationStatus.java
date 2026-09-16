package com.z7design.fleet_manager.model.enums;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * PRD 1.0 - Módulo 5 (RF-05.2): status da conciliação entre o KM anotado
 * na Parte Diária e a telemetria do veículo.
 */
public enum TelemetryReconciliationStatus {
    /** Ainda não importado/confrontado. */
    NOT_RECONCILED("Não conciliado"),
    /** Divergência dentro da tolerância de 5%. */
    WITHIN_TOLERANCE("Dentro da tolerância"),
    /** Divergência superior a 5% — apontada para investigação. */
    DIVERGENT("Divergente");

    private final String description;

    TelemetryReconciliationStatus(String description) {
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
