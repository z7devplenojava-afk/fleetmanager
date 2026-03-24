package com.z7design.fleet_manager.model.enums;

public enum ContractStatus {
    ACTIVE("Ativo"),
    INACTIVE("Inativo"),
    EXPIRED("Expirado"),
    SUSPENDED("Suspenso"),
    PENDING("Pendente"),
    CANCELLED("Cancelado");
    
    private final String description;
    
    ContractStatus(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
} 
