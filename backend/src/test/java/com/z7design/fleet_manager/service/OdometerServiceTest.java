package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.DailyLog;
import com.z7design.fleet_manager.model.MaintenancePlan;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.DailyLogRepository;
import com.z7design.fleet_manager.repository.MaintenancePlanRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * PRD 1.0 - Módulo 6 (RF-06.1): hodômetro atualizado pela Parte Diária e
 * disparo de gatilhos de PMP.
 */
@ExtendWith(MockitoExtension.class)
class OdometerServiceTest {

    @Mock
    private DailyLogRepository dailyLogRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private MaintenancePlanRepository maintenancePlanRepository;

    @Mock
    private MaintenancePlanService maintenancePlanService;

    @InjectMocks
    private OdometerService service;

    private Vehicle vehicle;
    private DailyLog dailyLog;

    @BeforeEach
    void setUp() {
        vehicle = new Vehicle();
        vehicle.setId(UUID.randomUUID());
        vehicle.setPlate("ABC1D23");
        vehicle.setCurrentMileage(9000);

        dailyLog = new DailyLog();
        dailyLog.setId(UUID.randomUUID());
        dailyLog.setVehicle(vehicle);
        dailyLog.setFinalKm(9500);
    }

    @Test
    @DisplayName("Parte Diária com km final maior atualiza o hodômetro do veículo")
    void testOdometerUpdatedForward() {
        when(vehicleRepository.findById(vehicle.getId())).thenReturn(Optional.of(vehicle));
        when(maintenancePlanRepository.findByVehicleIdAndIsActiveTrueOrderById(vehicle.getId()))
                .thenReturn(List.of());
        when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(inv -> inv.getArgument(0));

        Integer result = service.updateOdometerFromDailyLog(dailyLog);

        assertEquals(9500, result);
        assertEquals(9500, vehicle.getCurrentMileage());
        verify(vehicleRepository).save(vehicle);
    }

    @Test
    @DisplayName("Parte Diária com km final menor NÃO rebaixa o hodômetro")
    void testOdometerNotDowngraded() {
        dailyLog.setFinalKm(8000);
        when(vehicleRepository.findById(vehicle.getId())).thenReturn(Optional.of(vehicle));

        Integer result = service.updateOdometerFromDailyLog(dailyLog);

        assertEquals(9000, result);
        verify(vehicleRepository, never()).save(any(Vehicle.class));
    }

    @Test
    @DisplayName("Parte Diária sem km final não altera hodômetro")
    void testNullFinalKmIgnored() {
        dailyLog.setFinalKm(null);
        Integer result = service.updateOdometerFromDailyLog(dailyLog);
        assertNull(result);
        verify(vehicleRepository, never()).save(any(Vehicle.class));
    }

    @Test
    @DisplayName("PMP disparado quando hodômetro atinge nextDueKm do plano")
    void testPreventiveMaintenanceTriggered() {
        MaintenancePlan overduePlan = new MaintenancePlan();
        overduePlan.setTaskName("Troca de óleo 15W40");
        overduePlan.setNextDueKm(20000);
        overduePlan.setIsActive(true);

        MaintenancePlan okPlan = new MaintenancePlan();
        okPlan.setTaskName("Revisão futura");
        okPlan.setNextDueKm(99000);
        okPlan.setIsActive(true);

        when(vehicleRepository.findById(vehicle.getId())).thenReturn(Optional.of(vehicle));
        when(maintenancePlanRepository.findByVehicleIdAndIsActiveTrueOrderById(vehicle.getId()))
                .thenReturn(List.of(overduePlan, okPlan));
        when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(inv -> inv.getArgument(0));

        // Hodômetro salta para 20.500 km → plano de 20.000 km vence
        dailyLog.setFinalKm(20500);
        service.updateOdometerFromDailyLog(dailyLog);

        // Ambos planos consultados para disparo: 1 vencido, 1 regular
        verify(maintenancePlanRepository).findByVehicleIdAndIsActiveTrueOrderById(vehicle.getId());
        assertEquals(20500, vehicle.getCurrentMileage());
    }

    @Test
    @DisplayName("triggerPreventiveMaintenance conta apenas planos vencidos")
    void testTriggerCount() {
        MaintenancePlan overdue1 = new MaintenancePlan();
        overdue1.setTaskName("P1");
        overdue1.setNextDueKm(10000);

        MaintenancePlan overdue2 = new MaintenancePlan();
        overdue2.setTaskName("P2");
        overdue2.setNextDueKm(20000);

        MaintenancePlan future = new MaintenancePlan();
        future.setTaskName("P3");
        future.setNextDueKm(90000);

        when(maintenancePlanRepository.findByVehicleIdAndIsActiveTrueOrderById(vehicle.getId()))
                .thenReturn(List.of(overdue1, overdue2, future));

        int count = service.triggerPreventiveMaintenance(vehicle, 25000);

        assertEquals(2, count);
    }
}
