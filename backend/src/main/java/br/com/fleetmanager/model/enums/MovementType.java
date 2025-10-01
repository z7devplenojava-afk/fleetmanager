package br.com.fleetmanager.model.enums;

public enum MovementType {
    ENTRADA("Entrada"),
    SAIDA("Saída"),
    WITHDRAWAL("Retirada"),
    PERMANENT_ASSIGNMENT("Atribuição Permanente"),
    TEMPORARY_USE("Uso Temporário"),
    RETURN("Devolução");

    private final String description;

    MovementType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}