package com.z7design.fleet_manager.model.enums;

public enum RondaPrioridade {
    BAIXA("Baixa"),
    MEDIA("MÃ©dia"),
    ALTA("Alta"),
    CRITICA("CrÃ­tica");
    
    private final String description;
    
    RondaPrioridade(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}


