package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.OpacityTest;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.OpacityTestRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * PRD 1.0 - Módulo 4 (RF-04.3): Laudo de Fumaça Preta (Escala Ringelmann).
 */
@ExtendWith(MockitoExtension.class)
class OpacityTestServiceTest {

    @Mock
    private OpacityTestRepository repository;

    @Mock
    private VehicleRepository vehicleRepository;

    @InjectMocks
    private OpacityTestService service;

    private Vehicle vehicle;

    @BeforeEach
    void setUp() {
        vehicle = new Vehicle();
        vehicle.setId(UUID.randomUUID());
        vehicle.setPlate("ABC1D23");

        lenient().when(vehicleRepository.findById(vehicle.getId())).thenReturn(Optional.of(vehicle));
    }

    private OpacityTest test(int scale) {
        OpacityTest t = new OpacityTest();
        t.setVehicle(vehicle);
        t.setTestDate(LocalDate.of(2026, 9, 10));
        t.setRingelmannScale(scale);
        return t;
    }

    @Test
    @DisplayName("Ringelmann 0-2 é APROVADO")
    void testApproved() {
        for (int scale : new int[]{0, 1, 2}) {
            when(repository.save(any(OpacityTest.class))).thenAnswer(inv -> inv.getArgument(0));
            OpacityTest saved = service.create(test(scale));
            assertEquals("APPROVED", saved.getResult());
            assertTrue(saved.isApproved());
        }
    }

    @Test
    @DisplayName("Ringelmann 3 é RESTRICTED")
    void testRestricted() {
        when(repository.save(any(OpacityTest.class))).thenAnswer(inv -> inv.getArgument(0));
        OpacityTest saved = service.create(test(3));
        assertEquals("RESTRICTED", saved.getResult());
        assertFalse(saved.isApproved());
    }

    @Test
    @DisplayName("Ringelmann 4-5 é DISAPPROVED")
    void testDisapproved() {
        for (int scale : new int[]{4, 5}) {
            when(repository.save(any(OpacityTest.class))).thenAnswer(inv -> inv.getArgument(0));
            OpacityTest saved = service.create(test(scale));
            assertEquals("DISAPPROVED", saved.getResult());
        }
    }

    @Test
    @DisplayName("Escala fora de 0-5 é rejeitada")
    void testInvalidScale() {
        assertThrows(IllegalArgumentException.class, () -> service.create(test(6)));
        assertThrows(IllegalArgumentException.class, () -> service.create(test(-1)));
    }

    @Test
    @DisplayName("Placa é copiada do veículo vinculado")
    void testPlateCopied() {
        when(repository.save(any(OpacityTest.class))).thenAnswer(inv -> inv.getArgument(0));
        OpacityTest saved = service.create(test(1));
        assertEquals("ABC1D23", saved.getVehiclePlate());
    }

    @Test
    @DisplayName("Sem placa e sem veículo é rejeitado")
    void testMissingPlate() {
        OpacityTest t = new OpacityTest();
        t.setTestDate(LocalDate.now());
        t.setRingelmannScale(1);
        assertThrows(IllegalArgumentException.class, () -> service.create(t));
    }

    @Test
    @DisplayName("Cobertura mensal: veículo testado não fica pendente")
    void testMonthlyCoverage() {
        OpacityTest done = test(1);
        done.setVehicle(vehicle);
        when(repository.findByTestDateBetweenOrderByTestDateAsc(
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30)))
                .thenReturn(List.of(done));
        when(vehicleRepository.findAll()).thenReturn(List.of(vehicle));

        Map<String, Object> coverage = service.getMonthlyCoverage(YearMonth.of(2026, 9));

        assertEquals(1, coverage.get("activeVehicles"));
        assertEquals(1, coverage.get("testedVehicles"));
        assertEquals(100.0, coverage.get("coveragePct"));
        List<?> pending = (List<?>) coverage.get("pendingVehicles");
        assertTrue(pending.isEmpty());
    }

    @Test
    @DisplayName("Cobertura mensal: veículo sem laudo fica pendente")
    void testMonthlyCoveragePending() {
        when(repository.findByTestDateBetweenOrderByTestDateAsc(
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30)))
                .thenReturn(List.of()); // nenhum laudo no mês
        when(vehicleRepository.findAll()).thenReturn(List.of(vehicle));

        Map<String, Object> coverage = service.getMonthlyCoverage(YearMonth.of(2026, 9));

        assertEquals(0, coverage.get("testedVehicles"));
        assertEquals(0.0, coverage.get("coveragePct"));
        List<?> pending = (List<?>) coverage.get("pendingVehicles");
        assertEquals(1, pending.size());
    }

    @Test
    @DisplayName("Laudo inexistente gera ResourceNotFoundException")
    void testNotFound() {
        UUID id = UUID.randomUUID();
        when(repository.existsById(id)).thenReturn(false);
        assertThrows(ResourceNotFoundException.class, () -> service.delete(id));
    }
}
