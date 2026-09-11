package com.z7design.fleet_manager.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MeasurementCalculationEngineTest {

    private MeasurementCalculationEngine calculationEngine;

    @BeforeEach
    void setUp() {
        calculationEngine = new MeasurementCalculationEngine();
    }

    @Test
    @DisplayName("Deve calcular a diÃ¡ria com base em R$ 31.500,00 por 30 dias = R$ 1.050,00")
    void testCalculateDailyRate() {
        BigDecimal monthly = new BigDecimal("31500.00");
        BigDecimal daily = calculationEngine.calculateDailyRate(monthly, 30);
        assertEquals(new BigDecimal("1050.00"), daily);
    }

    @Test
    @DisplayName("Deve calcular valor trabalhado: 23,5 dias x R$ 1.050,00 = R$ 24.675,00")
    void testCalculateWorkedValue() {
        BigDecimal daily = new BigDecimal("1050.00");
        BigDecimal workedDays = new BigDecimal("23.5");
        BigDecimal total = calculationEngine.calculateWorkedValue(daily, workedDays);
        assertEquals(new BigDecimal("24675.00"), total);
    }

    @Test
    @DisplayName("Deve calcular corte por manutenÃ§Ã£o: 6,5 dias x R$ 1.050,00 = R$ 6.825,00")
    void testCalculateCutValue() {
        BigDecimal daily = new BigDecimal("1050.00");
        BigDecimal stoppedDays = new BigDecimal("6.5");
        BigDecimal cut = calculationEngine.calculateCutValue(daily, stoppedDays);
        assertEquals(new BigDecimal("6825.00"), cut);
    }

    @Test
    @DisplayName("Deve calcular total da mediÃ§Ã£o GLOBAL = ServiÃ§os + Excedentes - Cortes - Descontos")
    void testCalculateGrandTotal() {
        BigDecimal services = new BigDecimal("420000.00");
        BigDecimal surpluses = new BigDecimal("17004.98");
        BigDecimal cuts = new BigDecimal("6825.00");
        BigDecimal discounts = new BigDecimal("1000.00");

        BigDecimal grandTotal = calculationEngine.calculateGrandTotal(services, surpluses, cuts, discounts);
        assertEquals(new BigDecimal("429179.98"), grandTotal);
    }

    @Test
    @DisplayName("Deve aplicar reajuste de 34,3884% sobre R$ 30.000,00")
    void testApplyAdjustment() {
        BigDecimal base = new BigDecimal("30000.00");
        BigDecimal percentage = new BigDecimal("34.3884");

        BigDecimal adjusted = calculationEngine.applyAdjustment(base, percentage);
        assertEquals(new BigDecimal("40316.52"), adjusted);
    }
}
