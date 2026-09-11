package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.MaintenancePlanDTO;
import com.z7design.fleet_manager.dto.MaintenancePlanStatusDTO;
import com.z7design.fleet_manager.dto.VehicleMaintenanceAlertDTO;
import com.z7design.fleet_manager.dto.VehicleMaintenanceStatusDTO;
import com.z7design.fleet_manager.model.MaintenancePlan;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.MaintenancePlanRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import com.z7design.fleet_manager.tenant.TenantAware;
import com.z7design.fleet_manager.tenant.TenantContext;
import com.z7design.fleet_manager.tenant.TenantEntityListener;
import jakarta.persistence.EntityListeners;
import org.hibernate.annotations.Filter;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

/**
 * Teste de regressão do isolamento multi-tenant dos planos de manutenção.
 * Garante que planos (e alertas derivados) de outras empresas não são
 * visíveis nem influenciam os veículos de outra empresa.
 */
@ExtendWith(MockitoExtension.class)
class MaintenancePlanTenantIsolationTest {

    private MaintenancePlanRepository planRepository;
    private VehicleRepository vehicleRepository;
    private MaintenancePlanService service;

    private UUID companyA;
    private UUID companyB;

    private Vehicle vehicleA1;
    private Vehicle vehicleA2;
    private Vehicle vehicleB1;

    private MaintenancePlan planAOverdue;
    private MaintenancePlan planAOk;
    private MaintenancePlan planBOverdue;

    @BeforeEach
    void setUp() {
        planRepository = mock(MaintenancePlanRepository.class);
        vehicleRepository = mock(VehicleRepository.class);
        service = new MaintenancePlanService(planRepository, vehicleRepository);

        companyA = UUID.randomUUID();
        companyB = UUID.randomUUID();

        // Empresa A: veículo 1 com km 50.000, veículo 2 com km 10.000
        vehicleA1 = buildVehicle(companyA, 50_000);
        vehicleA2 = buildVehicle(companyA, 10_000);
        // Empresa B: veículo com km 30.000
        vehicleB1 = buildVehicle(companyB, 30_000);

        // Empresa A — plano VENCIDO: nextDue 48.000 + 1.500 = 49.500 < 50.000 (km atual)
        planAOverdue = buildPlan(vehicleA1, "Troca de óleo", 48_000, 1_500, null);
        // Empresa A — plano EM DIA: 5.000 + 10.000 = 15.000 (faltam 5.000 km)
        planAOk = buildPlan(vehicleA2, "Revisão de freios", 5_000, 10_000, null);
        // Empresa B — plano VENCIDO: 28.000 + 1.000 = 29.000 < 30.000
        planBOverdue = buildPlan(vehicleB1, "Troca de pneus", 28_000, 1_000, null);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    // ── Testes ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Alertas em lote: planos da empresa B não influenciam veículos da empresa A")
    void bulkAlertsMustNotLeakForeignCompanyPlans() {
        when(vehicleRepository.findAll()).thenReturn(List.of(vehicleA1, vehicleA2));
        when(planRepository.findByIsActiveTrueAndVehicle_IdIn(anyCollection()))
                .thenReturn(List.of(planAOverdue, planAOk, planBOverdue));

        List<VehicleMaintenanceAlertDTO> alerts = service.getAllVehiclesMaintenanceAlerts();

        // A consulta de planos deve ser restrita aos veículos retornados (empresa A)
        verify(planRepository).findByIsActiveTrueAndVehicle_IdIn(argThat(ids -> {
            Collection<?> c = (Collection<?>) ids;
            return c.size() == 2
                    && c.contains(vehicleA1.getId())
                    && c.contains(vehicleA2.getId());
        }));

        assertEquals(2, alerts.size(), "Veículos da empresa B não devem aparecer");

        VehicleMaintenanceAlertDTO alertA1 = findAlert(alerts, vehicleA1.getId());
        VehicleMaintenanceAlertDTO alertA2 = findAlert(alerts, vehicleA2.getId());

        // O plano vencido da empresa B ("Troca de pneus") não pode vazar
        assertEquals(MaintenancePlanStatusDTO.AlertLevel.OVERDUE, alertA1.getAlertLevel());
        assertEquals("Troca de óleo", alertA1.getMostCriticalTaskName());

        assertEquals(MaintenancePlanStatusDTO.AlertLevel.OK, alertA2.getAlertLevel());
        assertNotEquals("Troca de pneus", alertA2.getMostCriticalTaskName());
    }

    @Test
    @DisplayName("Status por veículo: somente planos do próprio veículo são considerados")
    void statusOnlyIncludesRequestedVehiclePlans() {
        when(vehicleRepository.findById(vehicleA1.getId())).thenReturn(Optional.of(vehicleA1));
        when(planRepository.findByVehicleIdAndIsActiveTrueOrderById(vehicleA1.getId()))
                .thenReturn(List.of(planAOverdue));

        VehicleMaintenanceStatusDTO status = service.getVehicleMaintenanceStatus(vehicleA1.getId());

        assertEquals(1, status.getPlans().size());
        assertEquals(MaintenancePlanStatusDTO.AlertLevel.OVERDUE, status.getOverallAlertLevel());
        assertEquals("Troca de óleo", status.getMostCriticalPlan().getTaskName());
        assertEquals(vehicleA1.getCurrentMileage(), status.getCurrentMileage());
    }

    @Test
    @DisplayName("Criação: plano recebe a empresa do TenantContext do usuário autenticado")
    void createPlanStampsCompanyIdFromTenantContext() {
        try (MockedStatic<TenantContext> tenantContext = mockStatic(TenantContext.class)) {
            tenantContext.when(TenantContext::get).thenReturn(companyA);

            when(vehicleRepository.findById(vehicleA1.getId())).thenReturn(Optional.of(vehicleA1));
            when(planRepository.save(any(MaintenancePlan.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            MaintenancePlanDTO dto = MaintenancePlanDTO.builder()
                    .vehicleId(vehicleA1.getId())
                    .taskName("Plano Empresa A")
                    .intervalKm(5_000)
                    .lastExecutionKm(45_000)
                    .build();

            MaintenancePlanDTO saved = service.createOrUpdate(dto);

            assertEquals(companyA, saved.getCompanyId(),
                    "Plano deve ser criado na empresa do contexto, jamais em outra");
        }
    }

    @Test
    @DisplayName("Criação sem contexto (fluxo interno): cai para a empresa do veículo")
    void createPlanWithoutContextFallsBackToVehicleCompany() {
        try (MockedStatic<TenantContext> tenantContext = mockStatic(TenantContext.class)) {
            tenantContext.when(TenantContext::get).thenReturn(null);

            when(vehicleRepository.findById(vehicleB1.getId())).thenReturn(Optional.of(vehicleB1));
            when(planRepository.save(any(MaintenancePlan.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            MaintenancePlanDTO dto = MaintenancePlanDTO.builder()
                    .vehicleId(vehicleB1.getId())
                    .taskName("Plano Empresa B")
                    .intervalKm(2_000)
                    .build();

            MaintenancePlanDTO saved = service.createOrUpdate(dto);

            assertEquals(companyB, saved.getCompanyId());
        }
    }

    @Test
    @DisplayName("Entidade deve manter as proteções de tenant (@Filter, TenantAware, EntityListener)")
    void entityMustKeepTenantProtections() {
        Filter filter = MaintenancePlan.class.getAnnotation(Filter.class);
        assertNotNull(filter, "@Filter(tenantFilter) ausente — planos de outras empresas ficariam visíveis");
        assertEquals("tenantFilter", filter.name());
        assertTrue(filter.condition().contains("company_id"),
                "Filtro deve condicionar em company_id");

        assertTrue(TenantAware.class.isAssignableFrom(MaintenancePlan.class),
                "MaintenancePlan deve implementar TenantAware");

        EntityListeners listeners = MaintenancePlan.class.getAnnotation(EntityListeners.class);
        assertNotNull(listeners, "EntityListeners ausente");
        boolean hasTenantListener = Arrays.stream(listeners.value())
                .anyMatch(l -> l == TenantEntityListener.class);
        assertTrue(hasTenantListener,
                "TenantEntityListener ausente — criação/atualização cross-tenant não seria bloqueada");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Vehicle buildVehicle(UUID companyId, Integer mileage) {
        Vehicle v = new Vehicle();
        v.setId(UUID.randomUUID());
        v.setPlate("TST" + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        v.setModel("Modelo Teste");
        v.setBrand("Marca Teste");
        v.setCompanyId(companyId);
        v.setCurrentMileage(mileage);
        return v;
    }

    private MaintenancePlan buildPlan(Vehicle vehicle, String taskName,
                                      Integer lastExecutionKm, Integer intervalKm, Integer intervalDays) {
        MaintenancePlan p = MaintenancePlan.builder()
                .taskName(taskName)
                .vehicle(vehicle)
                .lastExecutionKm(lastExecutionKm)
                .intervalKm(intervalKm)
                .intervalDays(intervalDays)
                .isActive(true)
                .build();
        // Replica o estado persistido (calculateNextDue do serviço)
        if (lastExecutionKm != null && intervalKm != null) {
            p.setNextDueKm(lastExecutionKm + intervalKm);
        }
        p.setCompanyId(vehicle.getCompanyId());
        return p;
    }

    private VehicleMaintenanceAlertDTO findAlert(List<VehicleMaintenanceAlertDTO> alerts, UUID vehicleId) {
        return alerts.stream()
                .filter(a -> a.getVehicleId().equals(vehicleId))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Alerta não encontrado para o veículo " + vehicleId));
    }
}
