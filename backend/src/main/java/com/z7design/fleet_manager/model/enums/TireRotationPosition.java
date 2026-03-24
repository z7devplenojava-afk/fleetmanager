package com.z7design.fleet_manager.model.enums;

import lombok.Getter;

@Getter
public enum TireRotationPosition {
    FRONT_LEFT("Dianteiro Esquerdo"),
    FRONT_RIGHT("Dianteiro Direito"),
    REAR_LEFT_INTERNAL("Traseiro Esquerdo Interno"),
    REAR_LEFT_EXTERNAL("Traseiro Esquerdo Externo"),
    REAR_RIGHT_INTERNAL("Traseiro Direito Interno"),
    REAR_RIGHT_EXTERNAL("Traseiro Direito Externo"),
    SPARE("Estepe");

    private final String displayName;

    TireRotationPosition(String displayName) {
        this.displayName = displayName;
    }
}
