package com.z7design.fleet_manager.model.enums;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * PRD 1.0 - Módulo 5 (RF-05.3): motivo da classificação de viagem extra.
 * Viagens em fins de semana, feriados ou fora da escala contratada são
 * segregadas para a tabela de Viagens Extras do Boletim de Medição.
 */
public enum ExtraTripReason {
    WEEKEND("Fim de semana"),
    HOLIDAY("Feriado"),
    OUTSIDE_SHIFT("Fora da escala contratada");

    private final String description;

    ExtraTripReason(String description) {
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
