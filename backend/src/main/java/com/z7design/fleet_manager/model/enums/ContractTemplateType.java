package com.z7design.fleet_manager.model.enums;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * PRD 1.0 - Módulo 2 (RF-02.1): modelos contratuais disponíveis.
 */
public enum ContractTemplateType {
    /** Prestação de Serviços com Franquia de KM (Padrão Reframax/Vale). */
    FRANCHISE_KM("Prestação de Serviços com Franquia de KM"),

    /** Prestação de Serviços por Rotas e Linhas Dedicadas (Padrão Mineração Serra da Moeda / Construcap). */
    DEDICATED_ROUTES("Prestação de Serviços por Rotas e Linhas Dedicadas"),

    /** Locação Seca sem Mão de Obra e sem Combustível (Padrão Coopersind / Aterpa). */
    DRY_LEASE("Locação Seca sem Mão de Obra e sem Combustível");

    private final String description;

    ContractTemplateType(String description) {
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
