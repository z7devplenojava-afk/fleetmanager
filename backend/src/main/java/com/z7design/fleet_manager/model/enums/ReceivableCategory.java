package com.z7design.fleet_manager.model.enums;

public enum ReceivableCategory {
    INVOICE("Fatura"),
    NOTE("Nota Fiscal"),
    ADVANCE("Adiantamento"),
    SERVICE("Serviço"),
    PRODUCT("Produto"),
    MEASUREMENT("Medição de Contratos"),
    VEHICLE_RENTAL("Locação de Veículos"),
    CHARTER_TOURISM("Fretamento e Turismo"),
    OTHER("Outros");
    
    private final String description;
    
    ReceivableCategory(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}

