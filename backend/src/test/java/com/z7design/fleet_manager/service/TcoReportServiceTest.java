package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.VehicleTcoDTO;
import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.CostSimulation;
import com.z7design.fleet_manager.model.FleetWorkOrder;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.enums.CostSimulationStatus;
import com.z7design.fleet_manager.repository.CostSimulationRepository;
import com.z7design.fleet_manager.repository.DailyLogRepository;
import com.z7design.fleet_manager.repository.FleetWorkOrderRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * PRD 1.0 - Módulo 6 (RF-06.4): Painel de Decisão de Substituição — TCO.
 * Valida a regra: alerta se custo real/km > 20% do orçado OU mais de 3 paradas no mês.
 */
@ExtendWith(MockitoExtension.class)
class TcoReportServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private DailyLogRepository dailyLogRepository;

    @Mock
    private FleetWorkOrderRepository workOrderRepository;

    @Mock
    private CostSimulationRepository costSimulationRepository;

    @InjectMocks
    private TcoReportService service;

    private Vehicle vehicle;
    private LocalDate start;
    private LocalDate end;

    @BeforeEach
    void setUp() {
        vehicle = new Vehicle();
        vehicle.setId(UUID.randomUUID());
        vehicle.setPlate("ABC1D23");
        vehicle.setModel("OF-1721");
        vehicle.setBrand("Mercedes");
        vehicle.setYear(2020);
        vehicle.setClientId(UUID.randomUUID());

        start = LocalDate.of(2026, 9, 1);
        end = LocalDate.of(2026, 9, 30);

        // Base: 5000 km no mês, sem OS, sem orçamento
        lenient().when(dailyLogRepository.sumKmRunByVehicleAndPeriod(eq(vehicle.getId()), any(), any()))
                .thenReturn(5000L);
        lenient().when(dailyLogRepository.countDistinctDaysByVehicleAndPeriod(eq(vehicle.getId()), any(), any()))
                .thenReturn(22L);
        lenient().when(workOrderRepository.findByVehicleIdAndDeletedAtIsNull(vehicle.getId()))
                .thenReturn(List.of());
        lenient().when(costSimulationRepository.findByStatus(CostSimulationStatus.APPROVED))
                .thenReturn(List.of());
        lenient().when(vehicleRepository.findAll()).thenReturn(List.of(vehicle));
    }

    private FleetWorkOrder order(String totalCost) {
        FleetWorkOrder o = new FleetWorkOrder();
        o.setVehicle(vehicle);
        o.setTotalCost(new BigDecimal(totalCost));
        o.setActualDate(LocalDate.of(2026, 9, 10));
        o.setStartDate(LocalDateTime.of(2026, 9, 10, 8, 0));
        o.setCompletionDate(LocalDateTime.of(2026, 9, 10, 14, 0));
        return o;
    }

    private CostSimulation approvedBudget(String cvPerKm) {
        CostSimulation s = new CostSimulation();
        s.setStatus(CostSimulationStatus.APPROVED);
        s.setVariableCostPerKm(new BigDecimal(cvPerKm));
        Client client = new Client();
        // Orçamento vinculado ao mesmo cliente do veículo
        client.setId(vehicle.getClientId());
        s.setClient(client);
        return s;
    }

    @Test
    @DisplayName("Custo Real/KM = custo oficina / km rodado no mês")
    void testRealCostPerKm() {
        when(workOrderRepository.findByVehicleIdAndDeletedAtIsNull(vehicle.getId()))
                .thenReturn(List.of(order("1000.00"))); // R$ 1.000 / 5.000 km = 0,20/km

        VehicleTcoDTO dto = service.getFleetTco(vehicle.getPlate(), start, end).get(0);

        assertEquals(0, dto.getRealCostPerKm().compareTo(new BigDecimal("0.2000")));
        assertEquals(1L, dto.getWorkOrdersInMonth());
        assertEquals(6L, dto.getDowntimeHoursInMonth());
        assertEquals("NONE", dto.getRecommendation());
    }

    @Test
    @DisplayName("Alerta REPLACE quando custo real/km ultrapassa 20% do orçado")
    void testOverBudgetTriggersReplace() {
        // Orçado M1: 0,50/km. Real: (0,50 x 1,25) = 0,6250/km → variação +25% > 20%
        when(costSimulationRepository.findByStatus(CostSimulationStatus.APPROVED))
                .thenReturn(List.of(approvedBudget("0.50")));
        when(workOrderRepository.findByVehicleIdAndDeletedAtIsNull(vehicle.getId()))
                .thenReturn(List.of(order("3125.00"))); // 3125/5000 = 0,625

        VehicleTcoDTO dto = service.getFleetTco(vehicle.getPlate(), start, end).get(0);

        assertEquals(0, dto.getCostVariancePct().compareTo(new BigDecimal("0.2500")));
        assertTrue(dto.getOverBudget());
        assertEquals("REPLACE", dto.getRecommendation());
        assertTrue(dto.getRecommendationMessage().contains("frota reserva ou venda"));
    }

    @Test
    @DisplayName("Alerta REPLACE quando mais de 3 paradas no mês, mesmo dentro do orçamento")
    void testExcessiveStopsTriggersReplace() {
        when(workOrderRepository.findByVehicleIdAndDeletedAtIsNull(vehicle.getId()))
                .thenReturn(List.of(order("10.00"), order("10.00"), order("10.00"), order("10.00")));

        VehicleTcoDTO dto = service.getFleetTco(vehicle.getPlate(), start, end).get(0);

        assertEquals(4L, dto.getWorkOrdersInMonth());
        assertTrue(dto.getExcessiveStops());
        assertFalse(dto.getOverBudget());
        assertEquals("REPLACE", dto.getRecommendation());
    }

    @Test
    @DisplayName("Sem km rodado: custo real/km nulo e sem alerta de custo")
    void testZeroKmNoAlert() {
        when(dailyLogRepository.sumKmRunByVehicleAndPeriod(eq(vehicle.getId()), any(), any()))
                .thenReturn(0L);

        VehicleTcoDTO dto = service.getFleetTco(vehicle.getPlate(), start, end).get(0);

        assertNull(dto.getRealCostPerKm());
        assertNull(dto.getCostVariancePct());
        assertFalse(dto.getOverBudget());
        assertEquals("NONE", dto.getRecommendation());
    }

    @Test
    @DisplayName("Custo dentro do orçamento (variação <= 20%) não gera alerta")
    void testWithinBudgetNoAlert() {
        // Orçado: 0,50/km. Real: 0,55/km → variação +10% <= 20%
        when(costSimulationRepository.findByStatus(CostSimulationStatus.APPROVED))
                .thenReturn(List.of(approvedBudget("0.50")));
        when(workOrderRepository.findByVehicleIdAndDeletedAtIsNull(vehicle.getId()))
                .thenReturn(List.of(order("2750.00"))); // 2750/5000 = 0,55

        VehicleTcoDTO dto = service.getFleetTco(vehicle.getPlate(), start, end).get(0);

        assertEquals(0, dto.getCostVariancePct().compareTo(new BigDecimal("0.1000")));
        assertFalse(dto.getOverBudget());
        assertEquals("NONE", dto.getRecommendation());
    }

    @Test
    @DisplayName("Frota inteira: painel retorna um registro por veículo")
    void testFleetPanel() {
        Vehicle v2 = new Vehicle();
        v2.setId(UUID.randomUUID());
        v2.setPlate("XYZ9W87");

        when(vehicleRepository.findAll()).thenReturn(List.of(vehicle, v2));
        lenient().when(dailyLogRepository.sumKmRunByVehicleAndPeriod(eq(v2.getId()), any(), any()))
                .thenReturn(1000L);
        lenient().when(dailyLogRepository.countDistinctDaysByVehicleAndPeriod(eq(v2.getId()), any(), any()))
                .thenReturn(20L);
        lenient().when(workOrderRepository.findByVehicleIdAndDeletedAtIsNull(v2.getId()))
                .thenReturn(List.of());

        List<VehicleTcoDTO> result = service.getFleetTco(null, start, end);

        assertEquals(2, result.size());
    }
}
