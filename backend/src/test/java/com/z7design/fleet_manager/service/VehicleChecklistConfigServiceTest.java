package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.VehicleChecklistConfigCopyRequest;
import com.z7design.fleet_manager.dto.VehicleChecklistConfigCopyResponse;
import com.z7design.fleet_manager.dto.VehicleChecklistConfigDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.VehicleChecklistConfig;
import com.z7design.fleet_manager.repository.VehicleChecklistConfigRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
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

@ExtendWith(MockitoExtension.class)
class VehicleChecklistConfigServiceTest {

    @Mock
    private VehicleChecklistConfigRepository repository;

    @Mock
    private VehicleRepository vehicleRepository;

    @InjectMocks
    private VehicleChecklistConfigService service;

    /**
     * Cria um mock de veículo. Os stubs usam lenient() porque são chamados por
     * helpers (não por asserts diretos) e o Mockito estrito os consideraria
     * desnecessários em alguns cenários. IMPORTANTE: deve ser chamado ANTES de
     * iniciar qualquer when(...).thenReturn(...) externo (evita UnfinishedStubbing).
     */
    private Vehicle mockVehicle(UUID id, UUID companyId) {
        Vehicle vehicle = mock(Vehicle.class);
        lenient().when(vehicle.getId()).thenReturn(id);
        lenient().when(vehicle.getCompanyId()).thenReturn(companyId);
        return vehicle;
    }

    private VehicleChecklistConfigDTO item(String title, String category, boolean required) {
        return VehicleChecklistConfigDTO.builder()
                .title(title)
                .category(category)
                .required(required)
                .isActive(true)
                .build();
    }

    private VehicleChecklistConfigCopyRequest request(List<UUID> targets, List<VehicleChecklistConfigDTO> items) {
        return VehicleChecklistConfigCopyRequest.builder()
                .targetVehicleIds(targets)
                .items(items)
                .build();
    }

    /**
     * Cria uma entidade de item de checklist real (via builder) para os testes de
     * leitura (getForVehicle/getDefaultTemplate), pois o fromEntity lê vários getters.
     */
    private VehicleChecklistConfig entity(UUID id, String title, String category, boolean required,
                                          int sortOrder, Vehicle vehicle, UUID companyId) {
        return VehicleChecklistConfig.builder()
                .id(id)
                .vehicle(vehicle)
                .title(title)
                .category(category)
                .required(required)
                .sortOrder(sortOrder)
                .isActive(true)
                .companyId(companyId)
                .build();
    }

    // ───── copy(): caminho feliz ─────

    @Test
    void testCopy_ShouldApplyItemsToAllTargets_AndReturnSummary() {
        // Arrange
        UUID companyId = UUID.randomUUID();
        UUID v1 = UUID.randomUUID();
        UUID v2 = UUID.randomUUID();
        Vehicle veh1 = mockVehicle(v1, companyId);
        Vehicle veh2 = mockVehicle(v2, companyId);
        when(vehicleRepository.findById(v1)).thenReturn(Optional.of(veh1));
        when(vehicleRepository.findById(v2)).thenReturn(Optional.of(veh2));
        when(repository.save(any(VehicleChecklistConfig.class))).thenAnswer(inv -> inv.getArgument(0));

        VehicleChecklistConfigCopyRequest request = request(
                List.of(v1, v2),
                List.of(item("Faróis", "iluminacao", true), item("Pneus", "pneus", false)));

        // Act
        VehicleChecklistConfigCopyResponse response = service.copy(request);

        // Assert
        assertNotNull(response);
        assertEquals(2, response.getCopied());
        assertEquals(List.of(v1, v2), response.getVehicleIds());
        assertEquals(2, response.getItemsCount());
        // Cada destino teve sua configuração anterior removida e os itens persistidos
        verify(repository).deleteByVehicleId(v1);
        verify(repository).deleteByVehicleId(v2);
        verify(repository, times(4)).save(any(VehicleChecklistConfig.class));
    }

    @Test
    void testCopy_ShouldDeduplicateTargetVehicleIds() {
        // Arrange
        UUID companyId = UUID.randomUUID();
        UUID v1 = UUID.randomUUID();
        Vehicle veh1 = mockVehicle(v1, companyId);
        when(vehicleRepository.findById(v1)).thenReturn(Optional.of(veh1));
        when(repository.save(any(VehicleChecklistConfig.class))).thenAnswer(inv -> inv.getArgument(0));

        // Destinos com id duplicado
        VehicleChecklistConfigCopyRequest request = request(
                List.of(v1, v1),
                List.of(item("Faróis", "iluminacao", true)));

        // Act
        VehicleChecklistConfigCopyResponse response = service.copy(request);

        // Assert
        assertEquals(1, response.getCopied());
        assertEquals(List.of(v1), response.getVehicleIds());
        verify(vehicleRepository).findById(v1);
        verify(repository).deleteByVehicleId(v1);
        verify(repository, times(1)).save(any(VehicleChecklistConfig.class));
    }

    @Test
    void testCopy_ShouldIgnoreItemsWithBlankTitle() {
        // Arrange
        UUID companyId = UUID.randomUUID();
        UUID v1 = UUID.randomUUID();
        Vehicle veh1 = mockVehicle(v1, companyId);
        when(vehicleRepository.findById(v1)).thenReturn(Optional.of(veh1));
        when(repository.save(any(VehicleChecklistConfig.class))).thenAnswer(inv -> inv.getArgument(0));

        VehicleChecklistConfigCopyRequest request = request(
                List.of(v1),
                List.of(item("Faróis", "iluminacao", true),
                        item("   ", "pneus", false),
                        item("", "freios", false)));

        // Act
        VehicleChecklistConfigCopyResponse response = service.copy(request);

        // Assert
        assertEquals(1, response.getItemsCount());
        verify(repository, times(1)).save(any(VehicleChecklistConfig.class));
    }

    // ───── copy(): validações ─────

    @Test
    void testCopy_ShouldThrow_WhenNoTargetVehicles() {
        // Arrange
        VehicleChecklistConfigCopyRequest request = request(List.of(), List.of(item("Faróis", "iluminacao", true)));

        // Act & Assert
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.copy(request));
        assertTrue(ex.getMessage().contains("ao menos um veículo"));
        verifyNoInteractions(repository);
        verifyNoInteractions(vehicleRepository);
    }

    @Test
    void testCopy_ShouldThrow_WhenNoValidItems() {
        // Arrange
        UUID v1 = UUID.randomUUID();
        VehicleChecklistConfigCopyRequest request = request(List.of(v1), List.of(item("   ", "pneus", false)));

        // Act & Assert
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.copy(request));
        assertTrue(ex.getMessage().contains("Nenhum item válido"));
        verifyNoInteractions(repository);
        verifyNoInteractions(vehicleRepository);
    }

    @Test
    void testCopy_ShouldThrow_WhenVehicleNotFound() {
        // Arrange
        UUID v1 = UUID.randomUUID();
        when(vehicleRepository.findById(v1)).thenReturn(Optional.empty());

        VehicleChecklistConfigCopyRequest request = request(List.of(v1), List.of(item("Faróis", "iluminacao", true)));

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> service.copy(request));
        verifyNoInteractions(repository);
    }

    @Test
    void testCopy_ShouldNotDeleteAnything_WhenAnyTargetIsInvalid() {
        // Arrange: v1 existe, v2 não existe
        UUID companyId = UUID.randomUUID();
        UUID v1 = UUID.randomUUID();
        UUID v2 = UUID.randomUUID();
        Vehicle veh1 = mockVehicle(v1, companyId);
        when(vehicleRepository.findById(v1)).thenReturn(Optional.of(veh1));
        when(vehicleRepository.findById(v2)).thenReturn(Optional.empty());

        VehicleChecklistConfigCopyRequest request = request(
                List.of(v1, v2),
                List.of(item("Faróis", "iluminacao", true)));

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> service.copy(request));
        // A pré-validação falha antes de qualquer deleção/salvamento
        verify(repository, never()).deleteByVehicleId(any());
        verify(repository, never()).save(any());
    }

    // ───── replace(): regressão do helper compartilhado ─────

    @Test
    void testReplace_ShouldSaveGlobalTemplate_WhenVehicleIdIsNull() {
        // Arrange
        when(repository.save(any(VehicleChecklistConfig.class))).thenAnswer(inv -> inv.getArgument(0));
        UUID companyId = UUID.randomUUID();

        // Act
        service.replace(null, List.of(item("Faróis", "iluminacao", true)));

        // Assert: usa a deleção do template global e persiste com companyId do DTO
        verify(repository).deleteByVehicleIsNull();
        verify(repository, never()).deleteByVehicleId(any());
        verify(repository, times(1)).save(any(VehicleChecklistConfig.class));
    }

    @Test
    void testReplace_ShouldDeleteAndSave_ForSpecificVehicle() {
        // Arrange
        UUID companyId = UUID.randomUUID();
        UUID v1 = UUID.randomUUID();
        Vehicle veh1 = mockVehicle(v1, companyId);
        when(vehicleRepository.findById(v1)).thenReturn(Optional.of(veh1));
        when(repository.save(any(VehicleChecklistConfig.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        service.replace(v1, List.of(item("Pneus", "pneus", true)));

        // Assert
        verify(repository).deleteByVehicleId(v1);
        verify(repository, times(1)).save(any(VehicleChecklistConfig.class));
    }

    @Test
    void testReplace_ShouldThrow_WhenVehicleNotFound() {
        // Arrange
        UUID v1 = UUID.randomUUID();
        when(vehicleRepository.findById(v1)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> service.replace(v1, List.of(item("Faróis", "iluminacao", true))));
        verifyNoInteractions(repository);
    }

    // ───── getDefaultTemplate(): template padrão global ─────

    @Test
    void testGetDefaultTemplate_ShouldReturnMappedItems_WhenTemplateExists() {
        // Arrange
        UUID companyId = UUID.randomUUID();
        VehicleChecklistConfig t1 = entity(UUID.randomUUID(), "Faróis", "iluminacao", true, 0, null, companyId);
        VehicleChecklistConfig t2 = entity(UUID.randomUUID(), "Pneus", "pneus", false, 1, null, companyId);
        when(repository.findByVehicleIsNullAndIsActiveTrueOrderBySortOrderAsc()).thenReturn(List.of(t1, t2));

        // Act
        List<VehicleChecklistConfigDTO> result = service.getDefaultTemplate();

        // Assert
        assertEquals(2, result.size());
        assertEquals("Faróis", result.get(0).getTitle());
        assertEquals("iluminacao", result.get(0).getCategory());
        assertTrue(result.get(0).getRequired());
        assertEquals(0, result.get(0).getSortOrder());
        assertNull(result.get(0).getVehicleId()); // template global: sem veículo vinculado
        assertEquals(companyId, result.get(0).getCompanyId());
        assertEquals("Pneus", result.get(1).getTitle());
    }

    @Test
    void testGetDefaultTemplate_ShouldReturnEmptyList_WhenNoTemplate() {
        // Arrange
        when(repository.findByVehicleIsNullAndIsActiveTrueOrderBySortOrderAsc()).thenReturn(List.of());

        // Act
        List<VehicleChecklistConfigDTO> result = service.getDefaultTemplate();

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    // ───── getForVehicle(): itens customizados com fallback para o template global ─────

    @Test
    void testGetForVehicle_ShouldReturnCustomItems_WhenVehicleHasOwnConfig() {
        // Arrange
        UUID companyId = UUID.randomUUID();
        UUID v1 = UUID.randomUUID();
        Vehicle veh1 = mockVehicle(v1, companyId);
        VehicleChecklistConfig custom = entity(UUID.randomUUID(), "Extintor", "seguranca", true, 0, veh1, companyId);
        when(repository.findByVehicleIdAndIsActiveTrueOrderBySortOrderAsc(v1)).thenReturn(List.of(custom));

        // Act
        List<VehicleChecklistConfigDTO> result = service.getForVehicle(v1);

        // Assert
        assertEquals(1, result.size());
        assertEquals("Extintor", result.get(0).getTitle());
        assertEquals(v1, result.get(0).getVehicleId()); // item customizado do veículo
        // Com configuração própria, o template global NÃO é consultado
        verify(repository, never()).findByVehicleIsNullAndIsActiveTrueOrderBySortOrderAsc();
    }

    @Test
    void testGetForVehicle_ShouldFallbackToGlobalTemplate_WhenVehicleHasNoConfig() {
        // Arrange
        UUID companyId = UUID.randomUUID();
        UUID v1 = UUID.randomUUID();
        VehicleChecklistConfig t1 = entity(UUID.randomUUID(), "Faróis", "iluminacao", true, 0, null, companyId);
        when(repository.findByVehicleIdAndIsActiveTrueOrderBySortOrderAsc(v1)).thenReturn(List.of());
        when(repository.findByVehicleIsNullAndIsActiveTrueOrderBySortOrderAsc()).thenReturn(List.of(t1));

        // Act
        List<VehicleChecklistConfigDTO> result = service.getForVehicle(v1);

        // Assert
        assertEquals(1, result.size());
        assertEquals("Faróis", result.get(0).getTitle());
        assertNull(result.get(0).getVehicleId()); // item herdado do template global
    }

    @Test
    void testGetForVehicle_ShouldReturnGlobalTemplate_WhenVehicleIdIsNull() {
        // Arrange
        UUID companyId = UUID.randomUUID();
        VehicleChecklistConfig t1 = entity(UUID.randomUUID(), "Faróis", "iluminacao", true, 0, null, companyId);
        when(repository.findByVehicleIsNullAndIsActiveTrueOrderBySortOrderAsc()).thenReturn(List.of(t1));

        // Act
        List<VehicleChecklistConfigDTO> result = service.getForVehicle(null);

        // Assert
        assertEquals(1, result.size());
        assertEquals("Faróis", result.get(0).getTitle());
        // vehicleId null → nem consulta itens por veículo
        verify(repository, never()).findByVehicleIdAndIsActiveTrueOrderBySortOrderAsc(any());
    }

    @Test
    void testGetForVehicle_ShouldReturnEmpty_WhenNoCustomAndNoTemplate() {
        // Arrange
        UUID v1 = UUID.randomUUID();
        when(repository.findByVehicleIdAndIsActiveTrueOrderBySortOrderAsc(v1)).thenReturn(List.of());
        when(repository.findByVehicleIsNullAndIsActiveTrueOrderBySortOrderAsc()).thenReturn(List.of());

        // Act
        List<VehicleChecklistConfigDTO> result = service.getForVehicle(v1);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }
}
