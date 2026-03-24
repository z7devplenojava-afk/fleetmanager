package com.z7design.fleet_manager.model.enums;

import lombok.Getter;

@Getter
public enum CharterStatus {
    ACTIVE("Ativo"),
    INACTIVE("Inativo"),
    FINISHED("Finalizado"),
    SUSPENDED("Suspenso");

    private final String displayName;

    CharterStatus(String displayName) {
        this.displayName = displayName;
    }
}
