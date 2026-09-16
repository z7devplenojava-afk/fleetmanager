package com.z7design.fleet_manager.model.enums;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * PRD 1.0 - Módulo 2 (RF-02.3): status de versionamento/assinatura da minuta.
 */
public enum GeneratedContractStatus {
    DRAFT("Rascunho"),
    SENT("Enviada para Assinatura"),
    SIGNED("Assinada"),
    CANCELLED("Cancelada");

    private final String description;

    GeneratedContractStatus(String description) {
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
