package br.com.fleetmanager.model.enums;

public enum WorkPostStatus {
    EM_IMPLANTACAO("Em Implantação"),
    ATIVO("Ativo"),
    INATIVO("Inativo"),
    SUSPENSO("Suspenso"),
    CANCELADO("Cancelado"),
    EM_ANALISE("Em Análise"),
    PENDENTE("Pendente");
    
    private final String displayName;
    
    WorkPostStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
} 