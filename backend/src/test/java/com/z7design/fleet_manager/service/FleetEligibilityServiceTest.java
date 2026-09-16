package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.VehicleEligibilityDTO;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

/**
 * PRD 1.0 - Módulo 3 (RF-03.1): filtro de elegibilidade de frota.
 */
@ExtendWith(MockitoExtension.class)
class FleetEligibilityServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;

    @InjectMocks
    private FleetEligibilityService service;

    private Vehicle eligibleVehicle;

    @BeforeEach
    void setUp() {
        eligibleVehicle = new Vehicle();
        eligibleVehicle.setId(UUID.randomUUID());
        eligibleVehicle.setPlate("ABC1D23");
        eligibleVehicle.setModel("OF-1721");
        eligibleVehicle.setYear(LocalDate.now().getYear() - 3);
        eligibleVehicle.setHasAirConditioning(true);
        eligibleVehicle.setHasSeatBeltsAll(true);
        eligibleVehicle.setHasRetarder(true);
        eligibleVehicle.setHasCamera(true);
        eligibleVehicle.setHasTelemetry(true);
    }

    @Test
    @DisplayName("Veículo com todos os critérios é elegível")
    void testEligibleVehicle() {
        VehicleEligibilityDTO result = service.checkVehicle(eligibleVehicle);
        assertTrue(result.isEligible());
        assertTrue(result.getFailures().isEmpty());
        assertEquals(6, result.getCriteria().size());
    }

    @Test
    @DisplayName("Veículo com mais de 5 anos é reprovado")
    void testOldVehicleRejected() {
        eligibleVehicle.setYear(LocalDate.now().getYear() - 7);
        VehicleEligibilityDTO result = service.checkVehicle(eligibleVehicle);
        assertFalse(result.isEligible());
        assertTrue(result.getFailures().stream().anyMatch(f -> f.contains("IDADE_MAX_5_ANOS")));
    }

    @Test
    @DisplayName("Veículo sem ar-condicionado é reprovado")
    void testNoAcRejected() {
        eligibleVehicle.setHasAirConditioning(false);
        VehicleEligibilityDTO result = service.checkVehicle(eligibleVehicle);
        assertFalse(result.isEligible());
        assertTrue(result.getFailures().stream().anyMatch(f -> f.contains("AR_CONDICIONADO")));
    }

    @Test
    @DisplayName("Campos não preenchidos (null) reprovam o veículo")
    void testNullFieldsRejected() {
        eligibleVehicle.setHasTelemetry(null);
        eligibleVehicle.setHasRetarder(null);
        VehicleEligibilityDTO result = service.checkVehicle(eligibleVehicle);
        assertFalse(result.isEligible());
        assertEquals(2, result.getFailures().size());
    }

    @Test
    @DisplayName("Ano não informado reprova o veículo")
    void testMissingYearRejected() {
        eligibleVehicle.setYear(null);
        VehicleEligibilityDTO result = service.checkVehicle(eligibleVehicle);
        assertFalse(result.isEligible());
    }

    @Test
    @DisplayName("Filtro de frota retorna apenas elegíveis quando includeIneligible=false")
    void testFleetFilter() {
        Vehicle old = new Vehicle();
        old.setId(UUID.randomUUID());
        old.setPlate("XYZ9W87");
        old.setYear(2010);
        old.setHasAirConditioning(true);
        old.setHasSeatBeltsAll(true);
        old.setHasRetarder(true);
        old.setHasCamera(true);
        old.setHasTelemetry(true);

        when(vehicleRepository.findAll()).thenReturn(List.of(eligibleVehicle, old));

        List<VehicleEligibilityDTO> eligibleOnly = service.filterEligibleFleet(false);
        assertEquals(1, eligibleOnly.size());
        assertEquals("ABC1D23", eligibleOnly.get(0).getPlate());

        List<VehicleEligibilityDTO> all = service.filterEligibleFleet(true);
        assertEquals(2, all.size());
    }
}
