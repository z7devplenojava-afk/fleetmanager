package com.z7design.fleet_manager.model.enums;

public enum PaymentMethod {
    PIX("PIX"),
    BOLETO("Boleto"),
    TRANSFER("TransferÃªncia"),
    CASH("Dinheiro"),
    CARD("CartÃ£o");
    
    private final String description;
    
    PaymentMethod(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}

