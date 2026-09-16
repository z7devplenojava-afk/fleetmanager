package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.MobilizationInspection;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.MobilizationInspectionRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
 * PRD 1.0 - Módulo 3 (RF-03.3): Laudo de Vistoria de Mobilização.
 */
@ExtendWith(MockitoExtension.class)
class MobilizationInspectionServiceTest {

    @Mock
    private MobilizationInspectionRepository repository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private ClientRepository clientRepository;

    @InjectMocks
    private MobilizationInspectionService service;

    private MobilizationInspection inspection;
    private Vehicle vehicle;

    @BeforeEach
    void setUp() {
        vehicle = new Vehicle();
        vehicle.setId(UUID.randomUUID());
        vehicle.setPlate("ABC1D23");
        vehicle.setCurrentMileage(150000);

        inspection = new MobilizationInspection();
        inspection.setVehicle(vehicle);
        inspection.setBodyworkOk(true);
        inspection.setTiresOk(true);
        inspection.setTachographOk(true);
        inspection.setWarningTriangleOk(true);
        inspection.setWheelWrenchOk(true);
        inspection.setReverseAlarmOk(true);
        inspection.setCrlvAttached(true);
        inspection.setInspectorName("Fiscal Carlos");
        inspection.setClientRepresentativeName("Fiscal Vale");

        lenient().when(repository.findAll()).thenReturn(List.of());
    }

    @Test
    @DisplayName("Cria vistoria com nº de laudo e dados do veículo preenchidos")
    void testCreateInspection() {
        when(vehicleRepository.findById(vehicle.getId())).thenReturn(Optional.of(vehicle));
        when(repository.save(any(MobilizationInspection.class))).thenAnswer(inv -> inv.getArgument(0));

        MobilizationInspection saved = service.create(inspection);

        assertNotNull(saved.getRegistryNumber());
        assertTrue(saved.getRegistryNumber().startsWith("VIST-MOB-"));
        assertEquals("ABC1D23", saved.getVehiclePlate());
        assertEquals(150000, saved.getCurrentMileage());
        verify(repository).save(any(MobilizationInspection.class));
    }

    @Test
    @DisplayName("Aprovação falha com checklist incompleto")
    void testApprovalFailsIncompleteChecklist() {
        inspection.setWarningTriangleOk(false);
        inspection.setId(UUID.randomUUID());
        when(repository.findById(inspection.getId())).thenReturn(Optional.of(inspection));

        // create() com approved=false passa; mas approve() deve falhar por item do checklist
        assertThrows(IllegalArgumentException.class, () -> service.approve(inspection.getId()));
        verify(repository, never()).save(any(MobilizationInspection.class));
    }

    @Test
    @DisplayName("Aprovação falha sem CRLV anexado")
    void testApprovalFailsWithoutCrlv() {
        inspection.setCrlvAttached(false);
        when(vehicleRepository.findById(vehicle.getId())).thenReturn(Optional.of(vehicle));
        when(repository.save(any(MobilizationInspection.class))).thenAnswer(inv -> inv.getArgument(0));

        // Criação com approved=false não exige checklist completo
        MobilizationInspection saved = service.create(inspection);
        assertFalse(saved.getApproved());

        UUID id = saved.getId();
        when(repository.findById(id)).thenReturn(Optional.of(saved));
        assertThrows(IllegalArgumentException.class, () -> service.approve(id));
    }

    @Test
    @DisplayName("Aprovação falha sem representante do cliente (assinatura conjunta)")
    void testApprovalFailsWithoutClientSignature() {
        inspection.setClientRepresentativeName(null);
        when(vehicleRepository.findById(vehicle.getId())).thenReturn(Optional.of(vehicle));
        when(repository.save(any(MobilizationInspection.class))).thenAnswer(inv -> inv.getArgument(0));

        MobilizationInspection saved = service.create(inspection);
        UUID id = saved.getId();
        when(repository.findById(id)).thenReturn(Optional.of(saved));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.approve(id));
        assertTrue(ex.getMessage().contains("assinatura conjunta"));
    }

    @Test
    @DisplayName("Aprovação com checklist completo e assinaturas é liberada")
    void testApprovalSuccess() {
        when(vehicleRepository.findById(vehicle.getId())).thenReturn(Optional.of(vehicle));
        when(repository.save(any(MobilizationInspection.class))).thenAnswer(inv -> inv.getArgument(0));

        MobilizationInspection saved = service.create(inspection);
        UUID id = saved.getId();
        when(repository.findById(id)).thenReturn(Optional.of(saved));
        when(repository.save(any(MobilizationInspection.class))).thenAnswer(inv -> inv.getArgument(0));

        MobilizationInspection approved = service.approve(id);
        assertTrue(approved.getApproved());
    }

    @Test
    @DisplayName("PDF da vistoria é gerado")
    void testPdfGeneration() {
        inspection.setApproved(true);
        when(repository.save(any(MobilizationInspection.class))).thenAnswer(inv -> inv.getArgument(0));
        when(repository.findAll()).thenReturn(List.of());

        MobilizationInspection saved = service.create(inspection);
        saved.setId(UUID.randomUUID());
        when(repository.findById(saved.getId())).thenReturn(Optional.of(saved));

        byte[] pdf = service.generatePdf(saved.getId());

        assertNotNull(pdf);
        assertTrue(pdf.length > 500);
        assertEquals('%', pdf[0]);
    }
}
