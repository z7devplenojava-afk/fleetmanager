package com.z7design.fleet_manager.model.enums;

public enum MessageType {
    INDIVIDUAL("Individual"),
    GROUP("Grupo"),
    DEPARTMENT("Departamento"),
    GLOBAL("Global"),
    NOTIFICATION("NotificaÃ§Ã£o"),
    EMAIL("Email");
    
    private final String displayName;
    
    MessageType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
} 
