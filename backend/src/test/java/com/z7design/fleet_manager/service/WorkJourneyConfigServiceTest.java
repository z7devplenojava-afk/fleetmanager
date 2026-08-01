package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.WorkJourneyConfig;
import com.z7design.fleet_manager.repository.WorkJourneyConfigRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkJourneyConfigServiceTest {

    @Mock
    private WorkJourneyConfigRepository repository;

    @InjectMocks
    private WorkJourneyConfigService service;

    private UUID companyId;
    private WorkJourneyConfig existingConfig;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();

        existingConfig = WorkJourneyConfig.builder()
                .id(UUID.randomUUID())
                .companyId(companyId)
                .build();
    }

    // ───── findAll ─────

    @Test
    void testFindAll_ShouldReturnAllConfigs() {
        // Arrange
        WorkJourneyConfig config2 = WorkJourneyConfig.builder()
                .id(UUID.randomUUID())
                .companyId(UUID.randomUUID())
                .build();
        when(repository.findAll()).thenReturn(List.of(existingConfig, config2));

        // Act
        List<WorkJourneyConfig> result = service.findAll();

        // Assert
        assertEquals(2, result.size());
        verify(repository).findAll();
    }

    @Test
    void testFindAll_ShouldReturnEmptyList_WhenNoConfigs() {
        // Arrange
        when(repository.findAll()).thenReturn(List.of());

        // Act
        List<WorkJourneyConfig> result = service.findAll();

        // Assert
        assertTrue(result.isEmpty());
        verify(repository).findAll();
    }

    // ───── findByCompanyId ─────

    @Test
    void testFindByCompanyId_ShouldReturnExistingConfig() {
        // Arrange
        when(repository.findByCompanyId(companyId)).thenReturn(Optional.of(existingConfig));

        // Act
        WorkJourneyConfig result = service.findByCompanyId(companyId);

        // Assert
        assertNotNull(result);
        assertEquals(existingConfig.getId(), result.getId());
        assertEquals(companyId, result.getCompanyId());
        verify(repository).findByCompanyId(companyId);
        verify(repository, never()).save(any());
    }

    @Test
    void testFindByCompanyId_ShouldCreateDefault_WhenNotExists() {
        // Arrange
        when(repository.findByCompanyId(companyId)).thenReturn(Optional.empty());
        when(repository.save(any(WorkJourneyConfig.class))).thenAnswer(invocation -> {
            WorkJourneyConfig saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        // Act
        WorkJourneyConfig result = service.findByCompanyId(companyId);

        // Assert
        assertNotNull(result);
        assertEquals(companyId, result.getCompanyId());
        // Verify default values from @Builder.Default
        assertEquals(0, new java.math.BigDecimal("8.00").compareTo(result.getCargaHorariaDiaria()));
        assertEquals(10, result.getToleranciaAtrasoMin());
        assertEquals(60, result.getIntervaloMin());
        assertTrue(result.getAtivo());
        verify(repository).findByCompanyId(companyId);
        verify(repository).save(any(WorkJourneyConfig.class));
    }

    // ───── findActiveByCompanyId ─────

    @Test
    void testFindActiveByCompanyId_ShouldReturnActiveConfig() {
        // Arrange
        when(repository.findByCompanyIdAndAtivoTrue(companyId))
                .thenReturn(Optional.of(existingConfig));

        // Act
        WorkJourneyConfig result = service.findActiveByCompanyId(companyId);

        // Assert
        assertNotNull(result);
        assertEquals(existingConfig.getId(), result.getId());
        verify(repository).findByCompanyIdAndAtivoTrue(companyId);
    }

    @Test
    void testFindActiveByCompanyId_ShouldReturnNull_WhenNotFound() {
        // Arrange
        when(repository.findByCompanyIdAndAtivoTrue(companyId))
                .thenReturn(Optional.empty());

        // Act
        WorkJourneyConfig result = service.findActiveByCompanyId(companyId);

        // Assert
        assertNull(result);
        verify(repository).findByCompanyIdAndAtivoTrue(companyId);
    }

    @Test
    void testFindActiveByCompanyId_ShouldReturnNull_WhenNotActive() {
        // Arrange
        // Repository query already filters by ativo=true, so it returns empty
        when(repository.findByCompanyIdAndAtivoTrue(companyId))
                .thenReturn(Optional.empty());

        // Act
        WorkJourneyConfig result = service.findActiveByCompanyId(companyId);

        // Assert
        assertNull(result);
        verify(repository).findByCompanyIdAndAtivoTrue(companyId);
    }

    // ───── saveOrUpdate ─────

    @Test
    void testSaveOrUpdate_ShouldCreateNewConfig_WithAllFields() {
        // Arrange
        when(repository.findByCompanyId(companyId)).thenReturn(Optional.empty());
        when(repository.save(any(WorkJourneyConfig.class))).thenAnswer(invocation -> {
            WorkJourneyConfig saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        Map<String, Object> updates = new java.util.HashMap<>();
        updates.put("cargaHorariaDiaria", "7.00");
        updates.put("toleranciaAtrasoMin", "5");
        updates.put("intervaloMin", "45");
        updates.put("percentualHENormal", "60.00");
        updates.put("percentualHENoturna", "70.00");
        updates.put("percentualHE100", "100.00");
        updates.put("cargaHorariaSemanal", "40.00");
        updates.put("inicioJornadaNoturna", "22");
        updates.put("fimJornadaNoturna", "5");
        updates.put("bancoHorasAtivo", "true");
        updates.put("geoObrigatoria", "true");
        updates.put("geoRaioMetros", "200");
        updates.put("ativo", "true");

        // Act
        WorkJourneyConfig result = service.saveOrUpdate(companyId, updates);

        // Assert
        assertNotNull(result);
        assertEquals(companyId, result.getCompanyId());
        assertEquals(0, new java.math.BigDecimal("7.00").compareTo(result.getCargaHorariaDiaria()));
        assertEquals(5, result.getToleranciaAtrasoMin());
        assertEquals(45, result.getIntervaloMin());
        assertEquals(0, new java.math.BigDecimal("60.00").compareTo(result.getPercentualHENormal()));
        assertEquals(0, new java.math.BigDecimal("70.00").compareTo(result.getPercentualHENoturna()));
        assertEquals(0, new java.math.BigDecimal("100.00").compareTo(result.getPercentualHE100()));
        assertEquals(0, new java.math.BigDecimal("40.00").compareTo(result.getCargaHorariaSemanal()));
        assertEquals(22, result.getInicioJornadaNoturna());
        assertEquals(5, result.getFimJornadaNoturna());
        assertTrue(result.getBancoHorasAtivo());
        assertTrue(result.getGeoObrigatoria());
        assertEquals(200, result.getGeoRaioMetros());
        assertTrue(result.getAtivo());

        verify(repository).findByCompanyId(companyId);
        verify(repository).save(any(WorkJourneyConfig.class));
    }

    @Test
    void testSaveOrUpdate_ShouldUpdateExistingConfig_Partially() {
        // Arrange
        existingConfig.setCargaHorariaDiaria(new java.math.BigDecimal("6.00"));
        when(repository.findByCompanyId(companyId)).thenReturn(Optional.of(existingConfig));
        when(repository.save(any(WorkJourneyConfig.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Only update cargaHorariaDiaria, keep other defaults
        Map<String, Object> updates = Map.of(
                "cargaHorariaDiaria", "8.00"
        );

        // Act
        WorkJourneyConfig result = service.saveOrUpdate(companyId, updates);

        // Assert
        assertNotNull(result);
        assertEquals(0, new java.math.BigDecimal("8.00").compareTo(result.getCargaHorariaDiaria()));
        // Other fields should remain untouched from default builder
        assertEquals(10, result.getToleranciaAtrasoMin());
        assertEquals(60, result.getIntervaloMin());

        verify(repository).findByCompanyId(companyId);
        verify(repository).save(existingConfig);
    }

    @Test
    void testSaveOrUpdate_ShouldDisableConfig() {
        // Arrange
        when(repository.findByCompanyId(companyId)).thenReturn(Optional.of(existingConfig));
        when(repository.save(any(WorkJourneyConfig.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Map<String, Object> updates = Map.of(
                "ativo", "false"
        );

        // Act
        WorkJourneyConfig result = service.saveOrUpdate(companyId, updates);

        // Assert
        assertFalse(result.getAtivo());
        verify(repository).save(existingConfig);
    }

    @Test
    void testSaveOrUpdate_ShouldToggleBancoHorasAtivo() {
        // Arrange
        when(repository.findByCompanyId(companyId)).thenReturn(Optional.of(existingConfig));
        when(repository.save(any(WorkJourneyConfig.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Map<String, Object> updates = Map.of(
                "bancoHorasAtivo", "true"
        );

        // Act
        WorkJourneyConfig result = service.saveOrUpdate(companyId, updates);

        // Assert
        assertTrue(result.getBancoHorasAtivo());
        verify(repository).save(existingConfig);
    }

    // ───── deleteById ─────

    @Test
    void testDeleteById_ShouldDeleteConfig() {
        // Arrange
        UUID configId = UUID.randomUUID();
        doNothing().when(repository).deleteById(configId);

        // Act
        service.deleteById(configId);

        // Assert
        verify(repository).deleteById(configId);
    }


}
