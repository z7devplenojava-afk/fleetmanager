package com.z7design.fleet_manager.model.enums;

public enum ExpenseStatus {
    PENDENTE("Pendente"),
    PAGA("Paga"),
    SOLICITADA("Solicitada"),
    ERRO("Erro"),
    CANCELADA("Cancelada"),
    PAGA_ANTERIORMENTE("Paga Anteriormente"),
    PENDENTE_ERRO("Pendente / Erro");
    
    private final String displayName;
    
    ExpenseStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
} 
