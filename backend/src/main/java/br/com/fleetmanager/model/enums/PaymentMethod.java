package br.com.fleetmanager.model.enums;

public enum PaymentMethod {
    PIX("PIX"),
    BOLETO("Boleto"),
    TRANSFER("Transferência"),
    CASH("Dinheiro"),
    CARD("Cartão");
    
    private final String description;
    
    PaymentMethod(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}
