package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Dashboard de ocupação das garagens: totais consolidados, situação de cada
 * garagem e contagem de alertas de lotação (>= 90% atenção, 100% lotada).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GarageOccupancyDashboardDTO {

    /** Situação de cada garagem (com occupancyRate, atCapacity, nearCapacity). */
    private List<GarageDTO> garages;

    private Integer totalGarages;

    /** Veículos alocados em todas as garagens. */
    private Long totalVehicles;

    /** Soma das capacidades das garagens que possuem capacidade definida. */
    private Long totalCapacity;

    /** Ocupação geral em % (totalVehicles / totalCapacity). null = nenhuma capacidade definida. */
    private Double overallOccupancy;

    /** Quantas garagens possuem capacidade definida. */
    private Long garagesWithCapacity;

    /** 🚨 Garagens lotadas (100%). */
    private Long fullGarages;

    /** ⚠️ Garagens em atenção (>= 90% e < 100%). */
    private Long nearCapacityGarages;

    /** Total de veículos por status em todas as garagens (ex.: MAINTENANCE -> 7). */
    @Builder.Default
    private Map<String, Long> fleetStatusTotals = Map.of();
}
