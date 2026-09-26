package com.z7design.fleet_manager.model.enums;

/**
 * Tipos de movimentação de estoque registradas no ledger imutável do Almoxarifado.
 */
public enum WarehouseMovementType {
    /** Entrada proveniente de compra / NF-e recebida. */
    ENTRADA_COMPRA,

    /** Saída de peças ou insumos aplicados em Ordem de Serviço de manutenção. */
    SAIDA_ORDEM_SERVICO,

    /** Saída para consumo interno administrativo ou operacional geral. */
    SAIDA_CONSUMO,

    /** Transferência entre almoxarifados ou garagens da empresa. */
    TRANSFERENCIA,

    /** Devolução de mercadoria ao fornecedor. */
    DEVOLUCAO,

    /** Montagem/instalação de pneu ou bateria em um veículo da frota. */
    INSTALACAO_VEICULO,

    /** Desmontagem/remoção de pneu ou bateria de um veículo da frota. */
    REMOCAO_VEICULO,

    /** Envio de pneu para recapadora / prestador de reforma. */
    ENVIO_REFORMA,

    /** Retorno de pneu reformado com nova banda e sulco. */
    RETORNO_REFORMA,

    /** Ajuste positivo de saldo decorrente de auditoria de inventário. */
    AJUSTE_INVENTARIO_ENTRADA,

    /** Ajuste negativo de saldo decorrente de perda/falta em inventário. */
    AJUSTE_INVENTARIO_SAIDA,

    /** Baixa definitiva e descarte de item condenado como sucata. */
    SUCATA_DESCARTE
}
