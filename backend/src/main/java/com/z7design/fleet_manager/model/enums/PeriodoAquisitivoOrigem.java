package com.z7design.fleet_manager.model.enums;

/**
 * Origem da criacao do Periodo Aquisitivo.
 */
public enum PeriodoAquisitivoOrigem {
    /** Gerado automaticamente no aniversario de admissao. */
    ADMISSAO,
    /** Reinicio de contagem apos gozo de ferias coletivas (Art. 140 par. unico). */
    COLETIVA,
    /** PA extinto por afastamento > 6 meses e reiniciado no retorno (Art. 133 IV). */
    RETORNO_AFASTAMENTO,
    /** Criado manualmente pelo DP. */
    MANUAL
}
