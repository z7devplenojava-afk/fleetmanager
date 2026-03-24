package com.z7design.fleet_manager.model.enums;

/**
 * Categorias de itens em um boletim de medição.
 * Reflete as seções identificadas nas imagens de referência.
 */
public enum MeasurementCategory {
    /** 1. Locação em Regime Global (Fixed lease) */
    LEASE,

    /** 2. Quilometragem Excedente (Excess KM calculation) */
    EXCESS_KM,

    /** 3. Combustíveis Adicionais (Additional fuel costs) */
    FUEL,

    /** 4. Custo Operacional de Motorista (Optional driver costs) */
    DRIVER_COST,

    /** 5. Retenção de Garantia (Automatic subtraction) */
    RETENTION,

    /** Viagem Extra (Para compatibilidade com lógica existente) */
    EXTRA_TRIP,

    /** Outros */
    OTHER
}
