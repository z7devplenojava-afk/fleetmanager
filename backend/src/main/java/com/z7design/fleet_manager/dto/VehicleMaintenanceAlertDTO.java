package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Resumo do alerta de manutenção de um veículo — versão enxuta do
 * VehicleMaintenanceStatusDTO para listagens (ex: badge na tabela de veículos).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleMaintenanceAlertDTO {

    private UUID vehicleId;
    private String plate;

    /** Alerta mais crítico entre os planos ativos do veículo */
    private MaintenancePlanStatusDTO.AlertLevel alertLevel;

    private long overdueCount;
    private long upcomingCount;

    /** Nome do plano mais crítico (vencido/próximo a vencer) */
    private String mostCriticalTaskName;

    /** Mensagem pronta para tooltip, ex: "Vencida há 200 km" */
    private String mostCriticalMessage;
}
