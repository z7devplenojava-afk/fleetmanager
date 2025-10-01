package br.com.fleetmanager.model.enums;

public enum EquipmentUsage {
    USO_DIARIO("Uso diário"),
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