package com.z7design.fleet_manager.model.enums;

public enum EquipmentSize {
    P("P"),
    M("M"),
    G("G"),
    GG("GG"),
    UNICO("Ãšnico");

    private final String description;

    EquipmentSize(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
} 
