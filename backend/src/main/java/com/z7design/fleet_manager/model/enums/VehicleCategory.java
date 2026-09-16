package com.z7design.fleet_manager.model.enums;

import com.fasterxml.jackson.annotation.JsonValue;

import java.math.BigDecimal;

/**
 * PRD 1.0 - Módulo 1: Categoria do veículo com coeficiente padrão de consumo diesel.
 * Ônibus = 0,4545 L/km (2,2 km/l); Micro = 0,40 L/km (2,5 km/l); Van = 0,222 L/km (4,5 km/l).
 */
public enum VehicleCategory {
    BUS("Ônibus Rodoviário com Ar", new BigDecimal("0.4545")),
    MICRO_BUS("Micro-ônibus", new BigDecimal("0.4000")),
    VAN("Van Sprinter", new BigDecimal("0.2222"));

    private final String description;
    private final BigDecimal dieselCoefficient;

    VehicleCategory(String description, BigDecimal dieselCoefficient) {
        this.description = description;
        this.dieselCoefficient = dieselCoefficient;
    }

    public String getDescription() {
        return description;
    }

    /** Coeficiente de consumo diesel em L/km (padrão PRD). */
    public BigDecimal getDieselCoefficient() {
        return dieselCoefficient;
    }

    @JsonValue
    public String toValue() {
        return name();
    }
}
