package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LavajatoStatsDTO {

    /** Total de registros. */
    private long totalRecords;

    /** Quantidade por status. */
    private long pending;
    private long inProgress;
    private long completed;

    /** Duração média dos serviços finalizados (em segundos). */
    private Long avgDurationSeconds;

    /** Duração mínima dos serviços finalizados (em segundos). */
    private Long minDurationSeconds;

    /** Duração máxima dos serviços finalizados (em segundos). */
    private Long maxDurationSeconds;

    /** Serviços finalizados hoje. */
    private long completedToday;

    /** Serviços finalizados esta semana. */
    private long completedThisWeek;

    /** Serviços finalizados este mês. */
    private long completedThisMonth;

    /** Taxa de conclusão (%). */
    private double completionRate;

    /** Itens do checklist interno mais frequentemente pulados (key -> count). */
    private Map<String, Long> skippedInternalItems;

    /** Itens do checklist externo mais frequentemente pulados (key -> count). */
    private Map<String, Long> skippedExternalItems;

    /** Veículos mais lavados (placa -> count). */
    private Map<String, Long> topVehicles;

    /** Operadores que mais realizaram serviços (nome -> count). */
    private Map<String, Long> topOperators;
}
