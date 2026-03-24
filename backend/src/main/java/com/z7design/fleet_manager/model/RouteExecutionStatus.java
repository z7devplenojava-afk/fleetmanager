package com.z7design.fleet_manager.model;

/**
 * Status de uma execução de rota.
 */
public enum RouteExecutionStatus {
    SCHEDULED,      // Agendada
    IN_PROGRESS,    // Em execução
    COMPLETED,      // Concluída
    CANCELLED,      // Cancelada
    DELAYED,        // Atrasada (iniciou mas com atraso significativo)
    REASSIGNED      // Reatribuída a outro motorista
}
