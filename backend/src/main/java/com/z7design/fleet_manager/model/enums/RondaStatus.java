package com.z7design.fleet_manager.model.enums;

public enum RondaStatus {
    AGENDADA("Agendada"),
    EM_ANDAMENTO("Em Andamento"),
    CONCLUIDA("ConcluÃ­da"),
    CANCELADA("Cancelada"),
    ATRASADA("Atrasada");
    
    private final String description;
    
    RondaStatus(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}


