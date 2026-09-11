package com.z7design.fleet_manager.service;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class MeasurementCalculationEngine {

    public static final int DEFAULT_SCALE = 2;
    public static final RoundingMode DEFAULT_ROUNDING = RoundingMode.HALF_UP;

    /**
     * Calcula o valor diÃ¡rio proporcional a partir do valor mensal e base de dias (padrÃ£o 30).
     */
    public BigDecimal calculateDailyRate(BigDecimal monthlyPrice, Integer baseDays) {
        if (monthlyPrice == null || monthlyPrice.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        int days = (baseDays != null && baseDays > 0) ? baseDays : 30;
        return monthlyPrice.divide(BigDecimal.valueOf(days), DEFAULT_SCALE, DEFAULT_ROUNDING);
    }

    /**
     * Calcula o valor medido bruto com base na diÃ¡ria e dias trabalhados.
     */
    public BigDecimal calculateWorkedValue(BigDecimal dailyRate, BigDecimal workedDays) {
        if (dailyRate == null || workedDays == null) {
            return BigDecimal.ZERO;
        }
        return dailyRate.multiply(workedDays).setScale(DEFAULT_SCALE, DEFAULT_ROUNDING);
    }

    /**
     * Calcula o valor do corte financeiro com base na diÃ¡ria e dias parados/manutenÃ§Ã£o.
     */
    public BigDecimal calculateCutValue(BigDecimal dailyRate, BigDecimal stoppedDays) {
        if (dailyRate == null || stoppedDays == null) {
            return BigDecimal.ZERO;
        }
        return dailyRate.multiply(stoppedDays).setScale(DEFAULT_SCALE, DEFAULT_ROUNDING);
    }

    /**
     * Calcula valor total de excedente (KM extra, diÃ¡ria extra, viagem extra).
     */
    public BigDecimal calculateSurplusTotal(BigDecimal quantity, BigDecimal unitPrice) {
        if (quantity == null || unitPrice == null) {
            return BigDecimal.ZERO;
        }
        return quantity.multiply(unitPrice).setScale(DEFAULT_SCALE, DEFAULT_ROUNDING);
    }

    /**
     * Calcula o total consolidado da mediÃ§Ã£o (GLOBAL).
     * TOTAL = (ServiÃ§os Brutos) + (Excedentes) - (Cortes) - (Descontos)
     */
    public BigDecimal calculateGrandTotal(BigDecimal subtotalServices, BigDecimal totalSurpluses, BigDecimal totalCuts, BigDecimal totalDiscounts) {
        BigDecimal services = (subtotalServices != null) ? subtotalServices : BigDecimal.ZERO;
        BigDecimal surpluses = (totalSurpluses != null) ? totalSurpluses : BigDecimal.ZERO;
        BigDecimal cuts = (totalCuts != null) ? totalCuts : BigDecimal.ZERO;
        BigDecimal discounts = (totalDiscounts != null) ? totalDiscounts : BigDecimal.ZERO;

        return services.add(surpluses).subtract(cuts).subtract(discounts).setScale(DEFAULT_SCALE, DEFAULT_ROUNDING);
    }

    /**
     * Aplica percentual de reajuste sobre o valor original.
     */
    public BigDecimal applyAdjustment(BigDecimal baseAmount, BigDecimal percentage) {
        if (baseAmount == null || percentage == null) {
            return baseAmount;
        }
        BigDecimal multiplier = BigDecimal.ONE.add(percentage.divide(new BigDecimal("100"), 6, DEFAULT_ROUNDING));
        return baseAmount.multiply(multiplier).setScale(DEFAULT_SCALE, DEFAULT_ROUNDING);
    }
}
