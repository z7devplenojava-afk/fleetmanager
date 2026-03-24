package com.z7design.fleet_manager.model.enums;

public enum RecordType {
    ENTRY("Entrada"),
    BREAK_START("Início do Intervalo"),
    BREAK_END("Fim do Intervalo"),
    EXIT("Saída");

    private final String description;

    RecordType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
