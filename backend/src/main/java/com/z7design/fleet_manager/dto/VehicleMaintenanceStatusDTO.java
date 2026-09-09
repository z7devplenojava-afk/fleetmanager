package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * Resumo do status de manutenção de um veículo: consolida os planos ativos,
 * a quilometragem atual e o alerta mais crítico — resposta do endpoint
 * GET /api/maintenance-plans/vehicle/{vehicleId}/status
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleMaintenanceStatusDTO {

    private UUID vehicleId;
    private String plate;
    private String model;
    private String brand;

    /** Quilometragem atual do veículo */
    private Integer currentMileage;

    /** Última manutenção registrada no veículo (cadastro) */
    private java.time.LocalDate lastMaintenanceDate;

    /** Próxima manutenção do veículo (cadastro) */
    private java.time.LocalDate nextMaintenanceDate;

    /** Planos de manutenção ativos com status calculado */
    private List<MaintenancePlanStatusDTO> plans;

    /** Alerta mais crítico entre os planos (OVERDUE > UPCOMING > OK > NO_SCHEDULE) */
    private MaintenancePlanStatusDTO.AlertLevel overallAlertLevel;

    /** Plano mais crítico (o vencido/próximo a vencer mais urgente) */
    private MaintenancePlanStatusDTO mostCriticalPlan;

    /** Quantidade de planos vencidos */
    private long overdueCount;

    /** Quantidade de planos próximos do vencimento */
    private long upcomingCount;
}
