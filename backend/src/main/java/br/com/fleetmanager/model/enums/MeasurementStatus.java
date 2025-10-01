package br.com.fleetmanager.model.enums;

public enum MeasurementStatus {
    DRAFT("Rascunho"),
    PENDING("Pendente"),
    VALIDATED("Validado"),
    CANCELLED("Cancelado");

    private final String description;

    MeasurementStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}