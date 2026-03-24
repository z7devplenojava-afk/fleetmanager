package com.z7design.fleet_manager.model.enums;

import lombok.Getter;

@Getter
public enum TireMovementType {
    PURCHASE("Compra"),
    INSTALLATION("Instalação"),
    REMOVAL("Remoção"),
    ROTATION("Rodízio"),
    RECAP_SEND("Envio para Recapagem"),
    RECAP_RETURN("Retorno de Recapagem"),
    SCRAP("Descarte");

    private final String displayName;

    TireMovementType(String displayName) {
        this.displayName = displayName;
    }
}
