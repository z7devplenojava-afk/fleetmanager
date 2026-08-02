package com.z7design.fleet_manager.model.enums;

public enum ContractType {
    ARRENDAMENTO("Arrendamento"),
    LOCACAO_VEICULOS("Locação de Veículos"),
    PRESTACAO_SERVICOS("Prestação de Serviços"),
    VENDA("Venda"),
    OUTROS("Outros");

    private final String description;

    ContractType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
