package br.com.fleetmanager.model.enums;

public enum ClientStatus {
    ACTIVE("Ativo"),
    INACTIVE("Inativo"),
    SUSPENDED("Suspenso"),
    PENDING("Pendente");
    
    private final String description;
    
    ClientStatus(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
} 