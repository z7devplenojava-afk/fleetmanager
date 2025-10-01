package br.com.fleetmanager.model.enums;

public enum EquipmentSize {
    P("P"),
    M("M"),
    G("G"),
    GG("GG"),
    UNICO("Único");

    private final String description;

    EquipmentSize(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
} 