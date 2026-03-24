package com.z7design.fleet_manager.model.enums;

public enum ReceivableStatus {
    PENDING("Pendente"),
    PAID("Pago"),
    OVERDUE("Vencido"),
    CANCELLED("Cancelado"),
    PARTIAL("Parcial");
    
    private final String description;
    
    ReceivableStatus(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}

