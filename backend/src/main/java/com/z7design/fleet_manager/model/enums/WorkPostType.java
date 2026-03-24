package com.z7design.fleet_manager.model.enums;

public enum WorkPostType {
    POSTO_24H("Posto 24 horas"),
    POSTO_12H_DIURNO("Posto 12HR Diurno"),
    POSTO_12H_NOTURNO("Posto 12HR Noturno"),
    POSTO_8H_DIURNO("Posto 8HR Diurno"),
    POSTO_8H_NOTURNO("Posto 8HR Noturno"),
    POSTO_SDF("Posto SDF (Sistema DescontÃ­nuo de Folga)"),
    POSTO_ESPECIAL("Posto Especial"),
    POSTO_6H("Posto 6 horas"),
    POSTO_8H("Posto 8 horas"),
    OUTROS("Outros");
    
    private final String displayName;
    
    WorkPostType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
} 
