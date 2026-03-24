package com.z7design.fleet_manager.model.enums;

public enum TimeBankStatus {
    OPEN("Aberto"),
    CLOSED("Fechado"),
    PAID("Pago");

    private final String description;

    TimeBankStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
