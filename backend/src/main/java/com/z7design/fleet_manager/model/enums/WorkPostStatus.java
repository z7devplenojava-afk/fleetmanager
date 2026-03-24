package com.z7design.fleet_manager.model.enums;

public enum WorkPostStatus {
    EM_IMPLANTACAO("Em ImplantaÃ§Ã£o"),
    ATIVO("Ativo"),
    INATIVO("Inativo"),
    SUSPENSO("Suspenso"),
    CANCELADO("Cancelado"),
    EM_ANALISE("Em AnÃ¡lise"),
    PENDENTE("Pendente");
    
    private final String displayName;
    
    WorkPostStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
} 
