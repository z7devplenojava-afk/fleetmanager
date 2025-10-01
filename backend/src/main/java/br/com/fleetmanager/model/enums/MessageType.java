package br.com.fleetmanager.model.enums;

public enum MessageType {
    INDIVIDUAL("Individual"),
    GROUP("Grupo"),
    DEPARTMENT("Departamento"),
    GLOBAL("Global"),
    NOTIFICATION("Notificação"),
    EMAIL("Email");
    
    private final String displayName;
    
    MessageType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
} 