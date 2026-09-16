package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.VehicleDreDTO;
import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.CostSimulation;
import com.z7design.fleet_manager.model.FleetWorkOrder;
import com.z7design.fleet_manager.model.FuelRecord;
import com.z7design.fleet_manager.model.MeasurementBulletin;
import com.z7design.fleet_manager.model.MeasurementItem;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.enums.CostSimulationStatus;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.CostSimulationRepository;
import com.z7design.fleet_manager.repository.DriverShiftRepository;
import com.z7design.fleet_manager.repository.FleetWorkOrderRepository;
import com.z7design.fleet_manager.repository.FuelRecordRepository;
import com.z7design.fleet_manager.repository.MeasurementBulletinRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VehicleDreServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;
    @Mock
    private MeasurementBulletinRepository bulletinRepository;
    @Mock
    private FuelRecordRepository fuelRecordRepository;
    @Mock
    private FleetWorkOrderRepository workOrderRepository;
    @Mock
    private DriverShiftRepository driverShiftRepository;
    @Mock
    private CostSimulationRepository costSimulationRepository;
    @Mock
    private ClientRepository clientRepository;

    private VehicleDreService service;

    private Vehicle vehicle;
    private Client client;

    @BeforeEach
    void setUp() {
        service = new VehicleDreService(vehicleRepository, bulletinRepository, fuelRecordRepository,
                workOrderRepository, driverShiftRepository, costSimulationRepository, clientRepository);

        client = new Client();
        client.setId(UUID.randomUUID());

        vehicle = new Vehicle();
        vehicle.setId(UUID.randomUUID());
        vehicle.setPlate("ABC1D23");
        vehicle.setModel("Ônibus G7");
        vehicle.setClientId(client.getId());
        vehicle.setAcquisitionValue(new BigDecimal("400000.00"));
        vehicle.setMarketValue(new BigDecimal("100000.00"));

        lenient().when(vehicleRepository.findAll()).thenReturn(List.of(vehicle));
        lenient().when(bulletinRepository.findAll()).thenReturn(List.of());
        lenient().when(fuelRecordRepository.findByVehicleIdAndDateBetween(any(), any(), any()))
                .thenReturn(List.of());
        lenient().when(workOrderRepository.findByVehicleIdAndDeletedAtIsNull(any()))
                .thenReturn(List.of());
        lenient().when(driverShiftRepository.findByVehicleIdAndShiftDateBetween(any(), any(), any()))
                .thenReturn(List.of());
        lenient().when(costSimulationRepository.findByStatus(CostSimulationStatus.APPROVED))
                .thenReturn(List.of());
        lenient().when(clientRepository.findById(client.getId())).thenReturn(Optional.of(client));
    }

    @Test
    void resultadoLiquidoComReceitaECustos() {
        // Receita faturada: diária R$ 5.000 + km excedente R$ 800
        MeasurementItem diaria = new MeasurementItem();
        diaria.setVehiclePlate("ABC1D23");
        diaria.setTotalValue(new BigDecimal("5000.00"));
        diaria.setDiaria(new BigDecimal("5000.00"));

        MeasurementItem kmExc = new MeasurementItem();
        kmExc.setVehiclePlate("ABC1D23");
        kmExc.setTotalValue(new BigDecimal("800.00"));
        kmExc.setValorKmExcedido(new BigDecimal("800.00"));

        MeasurementBulletin bulletin = new MeasurementBulletin();
        bulletin.setPeriodStart(LocalDate.of(2026, 8, 21));
        bulletin.setPeriodEnd(LocalDate.of(2026, 9, 20));
        bulletin.setItems(new java.util.ArrayList<>(List.of(diaria, kmExc)));
        when(bulletinRepository.findAll()).thenReturn(List.of(bulletin));

        // Custos: diesel R$ 1.200 + oficina R$ 600 + 2 motoristas alocados
        FuelRecord fuel = new FuelRecord();
        fuel.setDate(LocalDate.of(2026, 9, 5));
        fuel.setCost(new BigDecimal("1200.00"));
        when(fuelRecordRepository.findByVehicleIdAndDateBetween(any(), any(), any()))
                .thenReturn(List.of(fuel));

        FleetWorkOrder order = new FleetWorkOrder();
        order.setActualDate(LocalDate.of(2026, 9, 10));
        order.setTotalCost(new BigDecimal("600.00"));
        when(workOrderRepository.findByVehicleIdAndDeletedAtIsNull(any()))
                .thenReturn(List.of(order));

        VehicleDreDTO dre = service.getFleetDre("2026-09").get(0);

        assertEquals(0, new BigDecimal("5800.00").compareTo(dre.getGrossRevenue()));
        assertEquals(0, new BigDecimal("1200.00").compareTo(dre.getFuelCost()));
        assertEquals(0, new BigDecimal("600.00").compareTo(dre.getMaintenanceCost()));

        // Depreciação: (400.000 − 100.000) / 60 = 5.000,00
        assertEquals(0, new BigDecimal("5000.00").compareTo(dre.getDepreciation()));

        // Resultado = 5800 − impostos (11,83% sem simulação M1) − 1200 − 600 − folha − 5000
        assertTrue(dre.getNetResult().signum() < 0);
        assertTrue(dre.isLoss());
    }

    @Test
    void impostosUsamAliquotaDaSimulacaoAprovadaM1() {
        CostSimulation budget = new CostSimulation();
        budget.setId(UUID.randomUUID());
        budget.setClient(client);
        budget.setStatus(CostSimulationStatus.APPROVED);
        budget.setTaxesTotalPct(new BigDecimal("0.0500"));
        budget.setFixedDriverCost(new BigDecimal("7000.00"));
        when(costSimulationRepository.findByStatus(CostSimulationStatus.APPROVED))
                .thenReturn(List.of(budget));

        MeasurementItem item = new MeasurementItem();
        item.setVehiclePlate("ABC1D23");
        item.setTotalValue(new BigDecimal("10000.00"));
        item.setDiaria(new BigDecimal("10000.00"));

        MeasurementBulletin bulletin = new MeasurementBulletin();
        bulletin.setPeriodStart(LocalDate.of(2026, 8, 21));
        bulletin.setPeriodEnd(LocalDate.of(2026, 9, 20));
        bulletin.setItems(new java.util.ArrayList<>(List.of(item)));
        when(bulletinRepository.findAll()).thenReturn(List.of(bulletin));

        VehicleDreDTO dre = service.getFleetDre("2026-09").get(0);

        assertEquals(0, new BigDecimal("500.00").compareTo(dre.getTaxesValue()));
        assertEquals(0, new BigDecimal("9500.00").compareTo(dre.getNetRevenue()));
        assertEquals(0, new BigDecimal("0.0500").compareTo(dre.getTaxesPct()));
    }

    @Test
    void margemPositivaQuandoCustosBaixos() {
        MeasurementItem item = new MeasurementItem();
        item.setVehiclePlate("ABC1D23");
        item.setTotalValue(new BigDecimal("20000.00"));
        item.setDiaria(new BigDecimal("20000.00"));

        MeasurementBulletin bulletin = new MeasurementBulletin();
        bulletin.setPeriodStart(LocalDate.of(2026, 8, 21));
        bulletin.setPeriodEnd(LocalDate.of(2026, 9, 20));
        bulletin.setItems(new java.util.ArrayList<>(List.of(item)));
        when(bulletinRepository.findAll()).thenReturn(List.of(bulletin));

        VehicleDreDTO dre = service.getFleetDre("2026-09").get(0);

        // Receita 20.000 − impostos 2.366 − custos (folha padrão 5.950 + depreciação 5.000)
        assertTrue(dre.getNetResult().signum() > 0);
        assertTrue(dre.getResultMarginPct().signum() > 0);
    }

    @Test
    void veiculoSemReceitaTemMargemZeroESemErro() {
        VehicleDreDTO dre = service.getFleetDre("2026-09").get(0);

        assertEquals(0, BigDecimal.ZERO.compareTo(dre.getGrossRevenue()));
        assertEquals(0, BigDecimal.ZERO.compareTo(dre.getResultMarginPct()));
        assertEquals(0, BigDecimal.ZERO.compareTo(dre.getRealCostPerKm()));
        // Depreciação ainda incide sobre veículo parado
        assertEquals(0, new BigDecimal("5000.00").compareTo(dre.getDepreciation()));
    }

    @Test
    void consolidacaoPorClienteSomaVeiculos() {
        MeasurementItem item = new MeasurementItem();
        item.setVehiclePlate("ABC1D23");
        item.setTotalValue(new BigDecimal("10000.00"));
        item.setDiaria(new BigDecimal("10000.00"));

        MeasurementBulletin bulletin = new MeasurementBulletin();
        bulletin.setPeriodStart(LocalDate.of(2026, 8, 21));
        bulletin.setPeriodEnd(LocalDate.of(2026, 9, 20));
        bulletin.setItems(new java.util.ArrayList<>(List.of(item)));
        when(bulletinRepository.findAll()).thenReturn(List.of(bulletin));

        var byClient = service.getDreByClient("2026-09");

        @SuppressWarnings("unchecked")
        List<java.util.Map<String, Object>> rows =
                (List<java.util.Map<String, Object>>) byClient.get("clients");
        assertEquals(1, rows.size());
        assertEquals(0, new BigDecimal("10000.00")
                .compareTo((BigDecimal) rows.get(0).get("grossRevenue")));
    }
}
