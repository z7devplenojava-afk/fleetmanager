package com.z7design.fleet_manager.model.enums;

/**
 * Status do Periodo Aquisitivo de ferias (CLT Art. 129-137).
 */
public enum PeriodoAquisitivoStatus {
    /** PA corrente: colaborador ainda esta adquirindo o direito (12 meses de contrato). */
    EM_ANDAMENTO,
    /** PA encerrado, dentro dos 12 meses de periodo concessivo (Art. 134). */
    CONCESSIVO,
    /** Saldo zerado: todas as ferias do PA foram concedidas/quitadas. */
    QUITADO,
    /** Passou do limite_concessivo sem concessao (Art. 137 - risco de ferias em dobro). */
    EXPIRADO
}
