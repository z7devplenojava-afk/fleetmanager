package com.z7design.fleet_manager.model.enums;

/**
 * Escopo de amostragem de uma auditoria de inventário.
 */
public enum WarehouseInventoryScope {
    /** Inventário geral de todos os itens do almoxarifado. */
    ALL,

    /** Inventário restrito a uma categoria específica (ex: PNEUS, BATERIAS). */
    CATEGORY,

    /** Inventário restrito a uma localização física (corredor, estante, filial). */
    LOCATION,

    /** Inventário específico de um único produto/SKU. */
    PRODUCT
}
