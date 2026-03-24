package com.z7design.fleet_manager.model.enums;

public enum StockCategory {
    UNIFORME_VIGILANCIA("Uniforme VigilÃ¢ncia"),
    UNIFORME_SERVICOS("Uniforme ServiÃ§os"),
    UNIFORME_ADMINISTRATIVO("Uniforme Administrativo"),
    UNIFORME_COZINHA("Uniforme Cozinha"),
    EPI("Equipamento de ProteÃ§Ã£o Individual"),
    ACESSORIOS("AcessÃ³rios"),
    CALCADOS("CalÃ§ados");

    private final String description;

    StockCategory(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
