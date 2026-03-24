package com.z7design.fleet_manager.model.enums;

public enum ProtectionLevel {
    IIA("IIA"),
    II("II"),
    IIIA("IIIA"),
    III("III"),
    IV("IV");

    private final String description;

    ProtectionLevel(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
} 
