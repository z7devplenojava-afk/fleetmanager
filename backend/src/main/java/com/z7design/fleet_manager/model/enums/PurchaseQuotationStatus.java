package com.z7design.fleet_manager.model.enums;

public enum PurchaseQuotationStatus {
    DRAFT("Rascunho"),
    SENT("Enviado"),
    APPROVED("Aprovado"),
    REJECTED("Rejeitado"),
    EXPIRED("Expirado");

    private final String displayName;

    PurchaseQuotationStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}





















