package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * MÓDULO 7 — RF-07.5: DRE Real por Veículo (placa) e Centro de Custo.
 * Resultado Líquido = Receita Bruta − Impostos − Diesel − Manutenção/Peças
 *                     − Folha/Benefícios − Depreciação
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleDreDTO {

    private UUID vehicleId;
    private String plate;
    private String model;
    private String clientName;
    private UUID clientId;

    /** Período apurado (yyyy-MM). */
    private String referenceMonth;

    // ===== Receita (faturada por placa no BM) =====
    private BigDecimal grossRevenue;
    private BigDecimal extraTripsRevenue;
    private BigDecimal excessKmRevenue;

    // ===== Impostos =====
    private BigDecimal taxesPct;
    private BigDecimal taxesValue;
    private BigDecimal netRevenue;

    // ===== Custos diretos do veículo =====
    private BigDecimal fuelCost;
    private BigDecimal maintenanceCost;
    private BigDecimal payrollCost;

    /** Depreciação linear: (valor de aquisição − valor de mercado) / vida útil em meses (padrão 60). */
    private BigDecimal depreciation;
    private Integer usefulLifeMonths;

    // ===== Resultado =====
    private BigDecimal totalCosts;
    private BigDecimal netResult;
    private BigDecimal resultMarginPct;

    /** KM rodado no período (Parte Diária) para custo/km. */
    private BigDecimal kmDriven;
    private BigDecimal realCostPerKm;

    public boolean isLoss() {
        return netResult != null && netResult.signum() < 0;
    }
}
