package com.z7design.fleet_manager.model.enums;

public enum MovementType {
    ENTRADA("Entrada"),
    SAIDA("SaÃ­da"),
    WITHDRAWAL("Retirada"),
    PERMANENT_ASSIGNMENT("AtribuiÃ§Ã£o Permanente"),
    TEMPORARY_USE("Uso TemporÃ¡rio"),
    RETURN("DevoluÃ§Ã£o");

    private final String description;

    MovementType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
