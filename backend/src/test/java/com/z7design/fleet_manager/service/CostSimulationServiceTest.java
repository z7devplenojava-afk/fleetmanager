package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.CostSimulationDTO;
import com.z7design.fleet_manager.model.CostSimulation;
import com.z7design.fleet_manager.model.enums.VehicleCategory;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.ContractRepository;
import com.z7design.fleet_manager.repository.CostSimulationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * PRD 1.0 - Módulo 1: Testes do motor de cálculo paramétrico.
 * Valida as fórmulas do PRD com cenários de Ônibus (0,4545 L/km) e Van (0,222 L/km).
 */
@ExtendWith(MockitoExtension.class)
class CostSimulationServiceTest {

    @Mock
    private CostSimulationRepository repository;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private ContractRepository contractRepository;

    @InjectMocks
    private CostSimulationService service;

    private CostSimulation baseSimulation;

    @BeforeEach
    void setUp() {
        baseSimulation = new CostSimulation();
        baseSimulation.setName("Teste PRD");
        baseSimulation.setVehicleCategory(VehicleCategory.BUS);
        baseSimulation.setDriverCount(1);
        baseSimulation.setOperatingDays(22);
        baseSimulation.setDieselPrice(new BigDecimal("6.00"));
        baseSimulation.setBaseSalary(new BigDecimal("3000.00"));
        baseSimulation.setPayrollChargesPct(new BigDecimal("0.7000"));
        baseSimulation.setMealAllowance(BigDecimal.ZERO);
        baseSimulation.setHealthPlanCost(BigDecimal.ZERO);
        baseSimulation.setDailyKm(new BigDecimal("200"));
        baseSimulation.setProductivityFactor(new BigDecimal("1.1000"));
        baseSimulation.setMaintenancePerKm(BigDecimal.ZERO);
        baseSimulation.setTiresPerKm(BigDecimal.ZERO);
        baseSimulation.setLubricantsPerKm(BigDecimal.ZERO);
        baseSimulation.setPartsPerKm(BigDecimal.ZERO);
        baseSimulation.setFixedCosts(BigDecimal.ZERO);
        baseSimulation.setIssPct(new BigDecimal("0.05"));
        baseSimulation.setIcmsPct(new BigDecimal("0.1044"));
        baseSimulation.setPisPct(new BigDecimal("0.0065"));
        baseSimulation.setCofinsPct(new BigDecimal("0.03"));
        baseSimulation.setIrpjPct(new BigDecimal("0.024"));
        baseSimulation.setCsllPct(new BigDecimal("0.0108"));
        baseSimulation.setProfitMarginPct(new BigDecimal("0.10"));
        baseSimulation.setBdiPct(BigDecimal.ZERO);
        baseSimulation.setExtraTripMarginPct(new BigDecimal("0.15"));
    }

    @Test
    @DisplayName("CV/KM Ônibus: coeficiente 0,4545 x diesel 6,00 = 2,7270 R$/km")
    void testVariableCostPerKmBus() {
        service.calculate(baseSimulation);
        // 0.4545 * 6.00 = 2.7270
        assertEquals(0, baseSimulation.getVariableCostPerKm().compareTo(new BigDecimal("2.7270")));
    }

    @Test
    @DisplayName("CV/KM Van: coeficiente 0,2222 x diesel 6,00 = 1,3332 R$/km")
    void testVariableCostPerKmVan() {
        baseSimulation.setVehicleCategory(VehicleCategory.VAN);
        service.calculate(baseSimulation);
        // 0.2222 * 6.00 = 1.3332
        assertEquals(0, baseSimulation.getVariableCostPerKm().compareTo(new BigDecimal("1.3332")));
    }

    @Test
    @DisplayName("KM Franquia: 200 km/dia x 22 dias x 1,10 = 4.840 km")
    void testFranchiseKm() {
        service.calculate(baseSimulation);
        assertEquals(0, baseSimulation.getFranchiseKm().compareTo(new BigDecimal("4840.00")));
    }

    @Test
    @DisplayName("CTM: fixo (5100) + franquia x CV/KM")
    void testTotalMonthlyCost() {
        service.calculate(baseSimulation);
        // Fixo: (3000 x 1.70) = 5100
        assertEquals(0, baseSimulation.getTotalFixedCost().compareTo(new BigDecimal("5100.00")));
        // Franquia: 4840 x 2.7270 = 13198.68
        // CTM: 5100 + 13198.68 = 18298.68
        assertEquals(0, baseSimulation.getTotalMonthlyCost().compareTo(new BigDecimal("18298.68")));
    }

    @Test
    @DisplayName("Preço mensal com impostos somando 22,57% e margem 10%")
    void testMonthlyPrice() {
        service.calculate(baseSimulation);
        // Impostos: 5 + 10.44 + 0.65 + 3 + 2.4 + 1.08 = 22.57%
        assertEquals(0, baseSimulation.getTaxesTotalPct().compareTo(new BigDecimal("0.2257")));
        // Preço = 18298.68 x 1.10 / (1 - 0.2257) = 20128.548 / 0.7743 = 25995.80
        assertEquals(0, baseSimulation.getMonthlyPrice().compareTo(new BigDecimal("25995.80")));
    }

    @Test
    @DisplayName("Diária = preço mensal / 22 dias")
    void testDailyRate() {
        service.calculate(baseSimulation);
        // 25995.80 / 22 = 1181.63
        BigDecimal expected = new BigDecimal("25995.80").divide(new BigDecimal("22"), 2, java.math.RoundingMode.HALF_UP);
        assertEquals(0, baseSimulation.getDailyRate().compareTo(expected));
    }

    @Test
    @DisplayName("Tarifa KM excedente = (CTM / KM produtivo) x (1 + impostos)")
    void testExcessKmRate() {
        service.calculate(baseSimulation);
        // (18298.68 / 4400) x 1.2257 = 4.1588 x 1.2257 = 5.0974
        assertEquals(0, baseSimulation.getExcessKmRate().compareTo(new BigDecimal("5.0974")));
    }

    @Test
    @DisplayName("Viagem extra = diária x 1,15 (margem PRD de 15%)")
    void testExtraTripRate() {
        service.calculate(baseSimulation);
        BigDecimal expected = baseSimulation.getDailyRate()
                .multiply(new BigDecimal("1.15"))
                .setScale(2, java.math.RoundingMode.HALF_UP);
        assertEquals(0, baseSimulation.getExtraTripRate().compareTo(expected));
    }

    @Test
    @DisplayName("Regime de 2 turnos dobra o custo fixo de mão de obra")
    void testTwoDriversDoubleFixedCost() {
        baseSimulation.setDriverCount(2);
        service.calculate(baseSimulation);
        assertEquals(0, baseSimulation.getFixedDriverCost().compareTo(new BigDecimal("10200.00")));
    }

    @Test
    @DisplayName("Validação: diesel obrigatório e positivo")
    void testValidationDiesel() {
        baseSimulation.setDieselPrice(BigDecimal.ZERO);
        assertThrows(IllegalArgumentException.class, () -> service.create(new CostSimulationDTO()));
    }

    @Test
    @DisplayName("DTO roundtrip preserva campos calculados")
    void testDtoMapping() {
        service.calculate(baseSimulation);
        CostSimulationDTO dto = CostSimulationDTO.fromEntity(baseSimulation);
        assertEquals(baseSimulation.getVariableCostPerKm(), dto.getVariableCostPerKm());
        assertEquals(baseSimulation.getMonthlyPrice(), dto.getMonthlyPrice());
        assertEquals(baseSimulation.getFranchiseKm(), dto.getFranchiseKm());
        assertEquals(VehicleCategory.BUS, dto.getVehicleCategory());
    }
}
