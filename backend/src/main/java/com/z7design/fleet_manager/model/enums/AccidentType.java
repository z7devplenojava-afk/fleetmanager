package com.z7design.fleet_manager.model.enums;

/**
 * Tipos de acidentes de trabalho
 */
public enum AccidentType {
    COM_AFASTAMENTO("Com Afastamento"),
    SEM_AFASTAMENTO("Sem Afastamento"),
    MORTAL("Mortal"),
    TRAJETO("Trajeto");

    private final String description;

    AccidentType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}

