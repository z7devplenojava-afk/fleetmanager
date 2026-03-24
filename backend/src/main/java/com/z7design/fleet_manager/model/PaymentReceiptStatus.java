package com.z7design.fleet_manager.model;

public enum PaymentReceiptStatus {
    PENDING("PENDING", "Pendente"),
    PROCESSING("PROCESSING", "Processando"),
    PROCESSED("PROCESSED", "Processado"),
    ERROR("ERROR", "Erro no processamento");
    
    private final String code;
    private final String description;
    
    PaymentReceiptStatus(String code, String description) {
        this.code = code;
        this.description = description;
    }
    
    public String getCode() {
        return code;
    }
    
    public String getDescription() {
        return description;
    }
    
    @Override
    public String toString() {
        return description;
    }
}

