package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.FleetWorkOrder;
import com.z7design.fleet_manager.model.MeasurementBulletin;
import com.z7design.fleet_manager.model.MeasurementCut;
import com.z7design.fleet_manager.model.MeasurementItem;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.FleetWorkOrderRepository;
import com.z7design.fleet_manager.repository.MeasurementBulletinRepository;
import com.z7design.fleet_manager.repository.MeasurementCutRepository;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkshopCutServiceTest {

    @Mock
    private FleetWorkOrderRepository workOrderRepository;
    @Mock
    private MeasurementBulletinRepository bulletinRepository;
    @Mock
    private MeasurementCutRepository cutRepository;
    @Mock
    private VehicleRepository vehicleRepository;

    private WorkshopCutService service;

    private Vehicle vehicle;
    private MeasurementBulletin bulletin;

    @BeforeEach
    void setUp() {
        service = new WorkshopCutService(workOrderRepository, bulletinRepository,
                cutRepository, vehicleRepository);

        vehicle = new Vehicle();
        vehicle.setId(UUID.randomUUID());
        vehicle.setPlate("ABC1D23");

        MeasurementItem item = new MeasurementItem();
        item.setVehiclePlate("ABC1D23");
        item.setDiaria(new BigDecimal("850.00"));

        bulletin = new MeasurementBulletin();
        bulletin.setId(UUID.randomUUID());
        bulletin.setPeriodStart(LocalDate.of(2026, 8, 21));
        bulletin.setPeriodEnd(LocalDate.of(2026, 9, 20));
        bulletin.setItems(new java.util.ArrayList<>(List.of(item)));

        lenient().when(bulletinRepository.findById(bulletin.getId())).thenReturn(Optional.of(bulletin));
        lenient().when(cutRepository.findByBulletinId(bulletin.getId())).thenReturn(List.of());
        lenient().when(vehicleRepository.findAll()).thenReturn(List.of(vehicle));
        lenient().when(cutRepository.save(any(MeasurementCut.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void corteAplicadoQuandoParadoSemCarroReserva() {
        FleetWorkOrder order = workOrder(null, false,
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 6));
        when(workOrderRepository.findByVehicleIdAndDeletedAtIsNull(vehicle.getId()))
                .thenReturn(List.of(order));

        List<WorkshopCutService.VehicleCutResult> results =
                service.applyWorkshopCuts(bulletin.getId());

        assertEquals(1, results.size());
        // 01/09 a 06/09 = 6 dias parados (exemplo do PRD: corte de 6 dias)
        assertEquals(0, new BigDecimal("6").compareTo(results.get(0).cutDays()));
        assertEquals(0, new BigDecimal("5100.00").compareTo(results.get(0).cutAmount()));

        verify(cutRepository).save(any(MeasurementCut.class));
    }

    @Test
    void isentoQuandoCarroReservaCobreAParada() {
        FleetWorkOrder order = workOrder(null, true,
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 6));
        when(workOrderRepository.findByVehicleIdAndDeletedAtIsNull(vehicle.getId()))
                .thenReturn(List.of(order));

        List<WorkshopCutService.VehicleCutResult> results =
                service.applyWorkshopCuts(bulletin.getId());

        assertEquals(1, results.size());
        assertTrue(results.get(0).reserveCovered());
        assertEquals(0, BigDecimal.ZERO.compareTo(results.get(0).cutAmount()));
        verify(cutRepository, never()).save(any(MeasurementCut.class));
    }

    @Test
    void corteProporcionalQuandoParcialmenteCoberto() {
        // OS 1 coberta por reserva (2 dias), OS 2 sem reserva (0,5 dia — exemplo do PRD)
        FleetWorkOrder covered = workOrder(null, true,
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 2));
        FleetWorkOrder uncovered = workOrder(null, false,
                LocalDate.of(2026, 9, 10), LocalDate.of(2026, 9, 10));
        uncovered.setExitDate(LocalDate.of(2026, 9, 10));
        uncovered.setStopTime("12:00"); // meia diária
        when(workOrderRepository.findByVehicleIdAndDeletedAtIsNull(vehicle.getId()))
                .thenReturn(List.of(covered, uncovered));

        List<WorkshopCutService.VehicleCutResult> results =
                service.applyWorkshopCuts(bulletin.getId());

        assertEquals(1, results.size());
        assertEquals(0, new BigDecimal("1").compareTo(results.get(0).cutDays()));
        assertEquals(0, new BigDecimal("850.00").compareTo(results.get(0).cutAmount()));
    }

    @Test
    void veiculoSemOSNoPeriodoNaoGeraResultado() {
        when(workOrderRepository.findByVehicleIdAndDeletedAtIsNull(vehicle.getId()))
                .thenReturn(List.of());

        List<WorkshopCutService.VehicleCutResult> results =
                service.applyWorkshopCuts(bulletin.getId());

        assertTrue(results.isEmpty());
    }

    @Test
    void idempotenteNaoDuplicaCorte() {
        FleetWorkOrder order = workOrder(null, false,
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 3));
        when(workOrderRepository.findByVehicleIdAndDeletedAtIsNull(vehicle.getId()))
                .thenReturn(List.of(order));

        MeasurementCut existing = new MeasurementCut();
        existing.setVehicle(vehicle);
        existing.setCutDays(BigDecimal.ONE);
        existing.setCutAmount(new BigDecimal("850.00"));
        when(cutRepository.findByBulletinId(bulletin.getId())).thenReturn(List.of(existing));

        List<WorkshopCutService.VehicleCutResult> results =
                service.applyWorkshopCuts(bulletin.getId());

        assertEquals(1, results.size());
        assertEquals(0, BigDecimal.ZERO.compareTo(results.get(0).cutAmount()));
        verify(cutRepository, never()).save(any(MeasurementCut.class));
    }

    @Test
    void janelaDaOSLimitadaAoPeriodoDoBoletim() {
        // Parada começou antes do período do BM
        FleetWorkOrder order = workOrder(null, false,
                LocalDate.of(2026, 8, 10), LocalDate.of(2026, 8, 25));
        when(workOrderRepository.findByVehicleIdAndDeletedAtIsNull(vehicle.getId()))
                .thenReturn(List.of(order));

        List<WorkshopCutService.VehicleCutResult> results =
                service.applyWorkshopCuts(bulletin.getId());

        assertEquals(1, results.size());
        // Interseção: 21/08 a 25/08 = 5 dias
        assertEquals(0, new BigDecimal("5").compareTo(results.get(0).cutDays()));
    }

    private FleetWorkOrder workOrder(UUID id, boolean reserveCovered, LocalDate stop, LocalDate exit) {
        FleetWorkOrder order = new FleetWorkOrder();
        order.setId(UUID.randomUUID());
        order.setVehicle(vehicle);
        order.setOsNumber("OS-2026-001");
        order.setActualDate(stop);
        order.setStopDate(stop);
        order.setExitDate(exit);
        order.setReserveCovered(reserveCovered);
        return order;
    }
}
