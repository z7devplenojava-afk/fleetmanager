package br.com.fleetmanager.model.enums;

public enum StockCategory {
    UNIFORME_VIGILANCIA("Uniforme Vigilância"),
    UNIFORME_SERVICOS("Uniforme Serviços"),
    UNIFORME_ADMINISTRATIVO("Uniforme Administrativo"),
    UNIFORME_COZINHA("Uniforme Cozinha"),
    EPI("Equipamento de Proteção Individual"),
    ACESSORIOS("Acessórios"),
    CALCADOS("Calçados");

    private final String description;

    StockCategory(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}