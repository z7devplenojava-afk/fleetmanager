package com.z7design.fleet_manager.model.enums;

/**
 * Ciclo de vida e status de uma auditoria de inventário físico.
 */
public enum WarehouseInventoryStatus {
    /** Inventário criado e escopo definido. */
    CRIADO,

    /** Contagem física cega em andamento pelo almoxarifado. */
    EM_CONTAGEM,

    /** Segunda contagem ou conferência de divergências em andamento. */
    CONFERENCIA,

    /** Apuração concluída, aguardando aprovação da gestão de frota. */
    AGUARDANDO_APROVACAO,

    /** Ajustes aplicados no estoque e inventário encerrado. */
    FINALIZADO,

    /** Inventário cancelado antes do fechamento. */
    CANCELADO
}
