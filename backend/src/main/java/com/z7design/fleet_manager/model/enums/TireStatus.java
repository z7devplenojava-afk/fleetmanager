package com.z7design.fleet_manager.model.enums;

import lombok.Getter;

@Getter
public enum TireStatus {
    AVAILABLE("Disponível"),
    IN_USE("Em Uso"),
    RECAP("Para Recapagem"),
    SCRAPPED("Descartado");

    private final String displayName;

    TireStatus(String displayName) {
        this.displayName = displayName;
    }
}
