package com.z7design.fleet_manager.model.enums;

public enum VisitStatus {
    SCHEDULED("Agendada"),
    IN_PROGRESS("Em Andamento"),
    COMPLETED("ConcluÃ­da"),
    CANCELLED("Cancelada"),
    PENDING("Pendente"), // Mantido para compatibilidade
    NOT_COMPLETED("NÃ£o Realizada"); // Mantido para compatibilidade
    
    private final String description;
    
    VisitStatus(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}

