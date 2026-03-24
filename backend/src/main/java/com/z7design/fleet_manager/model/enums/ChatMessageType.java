package com.z7design.fleet_manager.model.enums;

public enum ChatMessageType {
    TEXT("Texto"),
    IMAGE("Imagem"),
    FILE("Arquivo"),
    AUDIO("Ãudio"),
    VIDEO("VÃ­deo"),
    SYSTEM("Sistema");
    
    private final String displayName;
    
    ChatMessageType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
} 
