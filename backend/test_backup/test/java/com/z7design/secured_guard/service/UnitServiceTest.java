package com.z7design.secured_guard.service;

import com.z7design.secured_guard.dto.CreateUnitRequest;
import com.z7design.secured_guard.dto.UnitDTO;
import com.z7design.secured_guard.dto.UpdateUnitRequest;
import com.z7design.secured_guard.exception.BusinessException;
import com.z7design.secured_guard.exception.ResourceNotFoundException;
import com.z7design.secured_guard.model.Client;
import com.z7design.secured_guard.model.Unit;
import com.z7design.secured_guard.repository.ClientRepository;
import com.z7design.secured_guard.repository.UnitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UnitServiceTest {

    @Mock
    private UnitRepository unitRepository;

    @Mock
    private ClientRepository clientRepository;

    @InjectMocks
    private UnitService unitService;

    private Unit testUnit;
    private Client testClient;
    private CreateUnitRequest createRequest;
    private UpdateUnitRequest updateRequest;

    @BeforeEach
    void setUp() {
        testClient = Client.builder()
                .id(UUID.randomUUID())
                .name("Test Client")
                .cnpj("12345678000123")
                .build();

        testUnit = Unit.builder()
                .id(UUID.randomUUID())
                .name("Test Unit")
                .description("Test Description")
                .address("Test Address, 123")
                .phone("(11) 1234-5678")
                .email("test@example.com")
                .code("TEST001")
                .manager("Test Manager")
                .active(true)
                .client(testClient)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        createRequest = CreateUnitRequest.builder()
                .name("New Unit")
                .description("New Description")
                .address("New Address, 456")
                .phone("(11) 9876-5432")
                .email("new@example.com")
                .code("NEW001")
                .manager("New Manager")
                .clientId(testClient.getId())
                .build();

        updateRequest = UpdateUnitRequest.builder()
                .name("Updated Unit")
                .description("Updated Description")
                .address("Updated Address, 789")
                .phone("(11) 5555-5555")
                .email("updated@example.com")
                .code("UPD001")
                .manager("Updated Manager")
                .build();
    }

    @Test
    void shouldCreateUnitSuccessfully() {
        // Given
        when(unitRepository.existsByCode(createRequest.getCode())).thenReturn(false);
        when(clientRepository.findById(testClient.getId())).thenReturn(Optional.of(testClient));
        when(unitRepository.save(any(Unit.class))).thenReturn(testUnit);

        // When
        UnitDTO result = unitService.createUnit(createRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo(testUnit.getName());
        assertThat(result.getCode()).isEqualTo(testUnit.getCode());
        assertThat(result.isActive()).isTrue();

        verify(unitRepository).existsByCode(createRequest.getCode());
        verify(clientRepository).findById(testClient.getId());
        verify(unitRepository).save(any(Unit.class));
    }

    @Test
    void shouldThrowExceptionWhenCreatingUnitWithExistingCode() {
        // Given
        when(unitRepository.existsByCode(createRequest.getCode())).thenReturn(true);

        // When & Then
        assertThatThrownBy(() -> unitService.createUnit(createRequest))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Já existe uma unidade com o código");

        verify(unitRepository).existsByCode(createRequest.getCode());
        verify(unitRepository, never()).save(any(Unit.class));
    }

    @Test
    void shouldThrowExceptionWhenClientNotFound() {
        // Given
        when(unitRepository.existsByCode(createRequest.getCode())).thenReturn(false);
        when(clientRepository.findById(testClient.getId())).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> unitService.createUnit(createRequest))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Cliente não encontrado");

        verify(unitRepository).existsByCode(createRequest.getCode());
        verify(clientRepository).findById(testClient.getId());
        verify(unitRepository, never()).save(any(Unit.class));
    }

    @Test
    void shouldUpdateUnitSuccessfully() {
        // Given
        when(unitRepository.findById(testUnit.getId())).thenReturn(Optional.of(testUnit));
        when(unitRepository.existsByCode(updateRequest.getCode())).thenReturn(false);
        when(unitRepository.save(any(Unit.class))).thenReturn(testUnit);

        // When
        UnitDTO result = unitService.updateUnit(testUnit.getId(), updateRequest);

        // Then
        assertThat(result).isNotNull();
        verify(unitRepository).findById(testUnit.getId());
        verify(unitRepository).save(any(Unit.class));
    }

    @Test
    void shouldThrowExceptionWhenUpdatingNonExistentUnit() {
        // Given
        UUID nonExistentId = UUID.randomUUID();
        when(unitRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> unitService.updateUnit(nonExistentId, updateRequest))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Unidade não encontrada");

        verify(unitRepository).findById(nonExistentId);
        verify(unitRepository, never()).save(any(Unit.class));
    }

    @Test
    void shouldFindUnitByIdSuccessfully() {
        // Given
        when(unitRepository.findById(testUnit.getId())).thenReturn(Optional.of(testUnit));

        // When
        UnitDTO result = unitService.findByIdAsDTO(testUnit.getId());

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(testUnit.getId());
        assertThat(result.getName()).isEqualTo(testUnit.getName());

        verify(unitRepository).findById(testUnit.getId());
    }

    @Test
    void shouldThrowExceptionWhenUnitNotFoundById() {
        // Given
        UUID nonExistentId = UUID.randomUUID();
        when(unitRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> unitService.findByIdAsDTO(nonExistentId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Unidade não encontrada");

        verify(unitRepository).findById(nonExistentId);
    }

    @Test
    void shouldFindUnitByCodeSuccessfully() {
        // Given
        when(unitRepository.findByCode(testUnit.getCode())).thenReturn(Optional.of(testUnit));

        // When
        UnitDTO result = unitService.findByCodeAsDTO(testUnit.getCode());

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getCode()).isEqualTo(testUnit.getCode());

        verify(unitRepository).findByCode(testUnit.getCode());
    }

    @Test
    void shouldFindAllActiveUnits() {
        // Given
        List<Unit> activeUnits = Arrays.asList(testUnit);
        when(unitRepository.findByActiveTrue()).thenReturn(activeUnits);

        // When
        List<UnitDTO> result = unitService.findAllActiveAsDTO();

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo(testUnit.getName());
        assertThat(result.get(0).isActive()).isTrue();

        verify(unitRepository).findByActiveTrue();
    }

    @Test
    void shouldToggleUnitActiveStatus() {
        // Given
        when(unitRepository.findById(testUnit.getId())).thenReturn(Optional.of(testUnit));
        when(unitRepository.save(any(Unit.class))).thenReturn(testUnit);

        // When
        UnitDTO result = unitService.toggleActiveAsDTO(testUnit.getId());

        // Then
        assertThat(result).isNotNull();
        verify(unitRepository).findById(testUnit.getId());
        verify(unitRepository).save(any(Unit.class));
    }

    @Test
    void shouldDeleteUnitSuccessfully() {
        // Given
        when(unitRepository.findById(testUnit.getId())).thenReturn(Optional.of(testUnit));
        doNothing().when(unitRepository).delete(testUnit);

        // When
        assertThatCode(() -> unitService.deleteUnit(testUnit.getId()))
                .doesNotThrowAnyException();

        // Then
        verify(unitRepository).findById(testUnit.getId());
        verify(unitRepository).delete(testUnit);
    }

    @Test
    void shouldCountActiveUnits() {
        // Given
        long expectedCount = 5L;
        when(unitRepository.countActiveUnits()).thenReturn(expectedCount);

        // When
        long result = unitService.countActiveUnits();

        // Then
        assertThat(result).isEqualTo(expectedCount);
        verify(unitRepository).countActiveUnits();
    }
}