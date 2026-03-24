package com.z7design.fleet_manager.model.enums;

public enum WorkScaleType {
    WEEKLY("Semanal"),
    ROTATING_12X36("Rotativo 12x36"),
    ROTATING_24X48("Rotativo 24x48"),
    CUSTOM("Customizado");

    private final String description;

    WorkScaleType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
