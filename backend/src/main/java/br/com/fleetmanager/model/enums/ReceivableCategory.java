package br.com.fleetmanager.model.enums;

public enum ReceivableCategory {
    INVOICE("Fatura"),
    NOTE("Nota Fiscal"),
    ADVANCE("Adiantamento"),
    SERVICE("Serviço"),
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
