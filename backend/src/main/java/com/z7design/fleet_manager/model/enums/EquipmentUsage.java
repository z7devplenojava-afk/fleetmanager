package com.z7design.fleet_manager.model.enums;

public enum EquipmentUsage {
    USO_DIARIO("Uso diÃ¡rio"),
    USO_EVENTUAL("Uso eventual"),
    RESERVADO("Reservado");

    private final String description;

    EquipmentUsage(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
} 
