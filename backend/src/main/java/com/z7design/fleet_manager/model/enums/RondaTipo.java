package com.z7design.fleet_manager.model.enums;

public enum RondaTipo {
    PREVENTIVA("Preventiva"),
    PATRULHAMENTO("Patrulhamento"),
    VIGILANCIA("VigilÃ¢ncia"),
    EMERGENCIA("EmergÃªncia"),
    ESPECIAL("Especial");
    
    private final String description;
    
    RondaTipo(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}


