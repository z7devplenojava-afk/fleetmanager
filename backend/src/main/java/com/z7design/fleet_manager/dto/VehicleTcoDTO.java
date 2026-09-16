package com.z7design.fleet_manager.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * PRD 1.0 - MÓDULO 6 (RF-06.4): Painel de Decisão de Substituição do Ativo — TCO.
 *
 * Monitoramento por veículo/placa:
 * Custo Real/KM = Gasto Acumulado (peças, pneus, oficina) no mês / KM rodado no mês.
 * Alerta se Custo Real/KM > 20% acima do orçado no Módulo 1 ou se acumular
 * mais de 3 paradas no mês → remanejamento para frota reserva ou venda (Tabela FIPE).
 */
@Data
public class VehicleTcoDTO {

    private UUID vehicleId;
    private String plate;
    private String model;
    private String brand;
    private Integer year;

    // ===== Período de apuração =====
    private Integer periodMonth;
    private Integer periodYear;

    // ===== KM e custo =====
    /** KM rodado no mês (Parte Diária, M5). */
    private Long kmRunInMonth;
    /** Gasto acumulado com oficina no mês (OS finalizadas: peças + mão de obra). */
    private BigDecimal maintenanceCostInMonth;
    /** Custo Real/KM = custo do mês / km do mês. */
    private BigDecimal realCostPerKm;
    /** Custo/KM orçado no Módulo 1 (CV/KM da simulação aprovada do veículo, se houver). */
    private BigDecimal budgetedCostPerKm;
    /** Diferença percentual real vs orçado (0.25 = 25% acima). */
    private BigDecimal costVariancePct;

    // ===== Disponibilidade =====
    /** Dias com Parte Diária registrada no mês. */
    private Long daysWithLog;
    /** Dias do período (calendário). */
    private Long daysInPeriod;
    /** OS do veículo no mês (paradas para manutenção). */
    private Long workOrdersInMonth;
    /** Horas paradas em oficina no mês. */
    private Long downtimeHoursInMonth;

    // ===== Decisão (RF-06.4) =====
    /** true se Custo Real/KM > orçado em mais de 20%. */
    private Boolean overBudget;
    /** true se mais de 3 paradas no mês. */
    private Boolean excessiveStops;
    /** NONE / WATCH / REPLACE — recomendação do sistema. */
    private String recommendation;
    /** Mensagem executiva da recomendação. */
    private String recommendationMessage;
}
