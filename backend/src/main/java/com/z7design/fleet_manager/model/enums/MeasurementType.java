package com.z7design.fleet_manager.model.enums;

public enum MeasurementType {
    GLOBAL("Global"),
    NFE("Nota Fiscal"),
    CTE("Conhecimento de Transporte");

    private final String description;

    MeasurementType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
