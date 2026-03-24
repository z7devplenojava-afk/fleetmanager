package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO com as estatísticas do dashboard de Gestão de Tráfego.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrafficDashboardStatsDTO {

    /** Viagens ativas (schedules em andamento hoje + driver shifts em andamento) */
    private long activeTrips;

    /** Total de embarques/escalas agendados hoje */
    private long boardingsToday;

    /** Alertas de geofence (execuções atrasadas + canceladas hoje) */
    private long geofenceAlerts;

    /** Taxa de ocupação (% de escalas aprovadas/em andamento sobre total de escalas do dia) */
    private double occupancyRate;

    /** Total de viagens (TravelTrips) cadastradas e ativas */
    private long totalActiveTravelTrips;

    /** Total de motoristas em turno hoje */
    private long driversOnShiftToday;

    /** Total de escalas do dia */
    private long totalSchedulesToday;

    /** Rotas concluídas hoje */
    private long completedRoutesToday;

    /** Rotas em execução agora */
    private long routesInProgressNow;

    /** Motoristas disponíveis para realocação */
    private long driversAvailableForReallocation;
}
