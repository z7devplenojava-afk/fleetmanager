package com.z7design.fleet_manager.model.enums;

/**
 * Modalidade de controle e rastreabilidade do produto no Almoxarifado Operacional.
 */
public enum WarehouseTrackingType {
    /** Controle simples apenas por saldo de quantidade. */
    QUANTITY,

    /** Controle por lote de fabricação e data de validade (PEPS/FEFO). */
    LOT_EXPIRATION,

    /** Controle por número de série unitário (alternadores, motores, compressores). */
    SERIAL_NUMBER,

    /** Pneu rastreável individualmente com controle de DOT, sulco, reformas e posições de eixos. */
    INDIVIDUAL_TIRE,

    /** Bateria rastreável individualmente com controle de série, garantia e CCA. */
    INDIVIDUAL_BATTERY
}
