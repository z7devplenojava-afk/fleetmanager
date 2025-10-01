package br.com.fleetmanager.model.enums;

public enum ChatMessageType {
    TEXT("Texto"),
    IMAGE("Imagem"),
    FILE("Arquivo"),
    AUDIO("Áudio"),
    VIDEO("Vídeo"),
    SYSTEM("Sistema");
    
    private final String displayName;
    
    ChatMessageType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
} 