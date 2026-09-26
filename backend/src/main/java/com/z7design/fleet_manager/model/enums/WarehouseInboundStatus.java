package com.z7design.fleet_manager.model.enums;

/**
 * Estados do fluxo de conferência e processamento do Documento de Entrada (NF-e).
 */
public enum WarehouseInboundStatus {
    /** Documento criado no sistema (via importação XML ou manual). */
    RECEBIDA,

    /** Almoxarife iniciou a conferência física e leitura de itens. */
    EM_CONFERENCIA,

    /** Conferência concluída com 100% de conformidade. */
    CONFERIDA,

    /** Apontada divergência física de quantidade, itens ou avarias. */
    DIVERGENTE,

    /** Saldo e lotes/seriais integrados e lançados no estoque físico. */
    ESTOQUE_PROCESSADO,

    /** Parcelas integradas e lançadas no Contas a Pagar / DDA. */
    FINANCEIRO_PROCESSADO,

    /** Fluxo de entrada finalizado com sucesso total. */
    FINALIZADA,

    /** Entrada cancelada antes do processamento fiscal/estoque. */
    CANCELADA,

    /** Documento estornado por auditoria após processamento. */
    ESTORNADA
}
