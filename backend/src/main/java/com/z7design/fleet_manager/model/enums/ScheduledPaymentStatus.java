package com.z7design.fleet_manager.model.enums;

public enum ScheduledPaymentStatus {
    SCHEDULED("Agendado"),
    EXECUTED("Executado"),
    CANCELLED("Cancelado"),
    OVERDUE("Vencido");
    
    private final String description;
    
    ScheduledPaymentStatus(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}

