package com.z7design.fleet_manager.model.enums;

public enum ReceivableCategory {
    INVOICE("Fatura"),
    NOTE("Nota Fiscal"),
    ADVANCE("Adiantamento"),
    SERVICE("ServiÃ§o"),
    PRODUCT("Produto"),
    OTHER("Outros");
    
    private final String description;
    
    ReceivableCategory(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}

