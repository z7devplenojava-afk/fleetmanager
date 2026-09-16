package com.z7design.fleet_manager.model.enums;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * PRD 1.0 - Módulo 1: Status da simulação de custos.
 * Diretoria valida margens mínimas de rentabilidade (aprovação).
 */
public enum CostSimulationStatus {
    DRAFT("Rascunho"),
    PENDING_APPROVAL("Aguardando Aprovação"),
    APPROVED("Aprovado"),
    REJECTED("Reprovado");

    private final String description;

    CostSimulationStatus(String description) {
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
