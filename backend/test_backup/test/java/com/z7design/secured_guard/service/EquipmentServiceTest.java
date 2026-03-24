package com.z7design.secured_guard.service;

import com.z7design.secured_guard.dto.CreateEquipmentRequest;
import com.z7design.secured_guard.dto.EquipmentDTO;
import com.z7design.secured_guard.exception.BusinessException;
import com.z7design.secured_guard.exception.ResourceNotFoundException;
import com.z7design.secured_guard.model.Equipment;
import com.z7design.secured_guard.model.Employee;
import com.z7design.secured_guard.model.enums.EquipmentSize;
import com.z7design.secured_guard.model.enums.EquipmentStatus;
import com.z7design.secured_guard.model.enums.EquipmentUsage;
import com.z7design.secured_guard.model.enums.ProtectionLevel;
import com.z7design.secured_guard.repository.EmployeeRepository;
import com.z7design.secured_guard.repository.EquipmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EquipmentServiceTest {

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private EquipmentService equipmentService;

    private Equipment testEquipment;
    private Employee testEmployee;
    private CreateEquipmentRequest createRequest;

    @BeforeEach
    void setUp() {
        testEmployee = Employee.builder()
                .id(UUID.randomUUID())
                .name("Test Employee")
                .build();

        testEquipment = Equipment.builder()
                .id(UUID.randomUUID())
                .serialNumber("EQ001")
                .status(EquipmentStatus.EM_ESTOQUE)
                .model("Test Model")
                .batch("BATCH001")
                .caNumber("CA12345")
                .protectionLevel(ProtectionLevel.IIIA)
                .size(EquipmentSize.M)
                .usageType(EquipmentUsage.USO_DIARIO)
                .manufacturingDate(LocalDate.now().minusYears(1))
                .validityDate(LocalDate.now().plusYears(4))
                .isDangerous(false)
                .currentUserId(null)
                .notes("Test notes")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        createRequest = CreateEquipmentRequest.builder()
                .serialNumber("NEW001")
                .status(EquipmentStatus.EM_ESTOQUE)
                .model("New Model")
                .batch("NEWBATCH")
                .caNumber("NEWCA123")
                .protectionLevel(ProtectionLevel.III)
                .size(EquipmentSize.G)
                .usageType(EquipmentUsage.USO_EVENTUAL)
                .manufacturingDate(LocalDate.now())
                .validityDate(LocalDate.now().plusYears(5))
                .isDangerous(false)
                .notes("New equipment notes")
                .build();
    }

    @Test
    void shouldCreateEquipmentSuccessfully() {
        // Given
        when(equipmentRepository.existsBySerialNumber(createRequest.getSerialNumber())).thenReturn(false);
        when(equipmentRepository.save(any(Equipment.class))).thenReturn(testEquipment);

        // When
        EquipmentDTO result = equipmentService.create(createRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getSerialNumber()).isEqualTo(testEquipment.getSerialNumber());
        assertThat(result.getStatus()).isEqualTo(testEquipment.getStatus());

        verify(equipmentRepository).existsBySerialNumber(createRequest.getSerialNumber());
        verify(equipmentRepository).save(any(Equipment.class));
    }

    @Test
    void shouldThrowExceptionWhenCreatingEquipmentWithExistingSerialNumber() {
        // Given
        when(equipmentRepository.existsBySerialNumber(createRequest.getSerialNumber())).thenReturn(true);

        // When & Then
        assertThatThrownBy(() -> equipmentService.create(createRequest))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Já existe um equipamento com o número de série");

        verify(equipmentRepository).existsBySerialNumber(createRequest.getSerialNumber());
        verify(equipmentRepository, never()).save(any(Equipment.class));
    }

    @Test
    void shouldFindEquipmentByIdSuccessfully() {
        // Given
        when(equipmentRepository.findById(testEquipment.getId())).thenReturn(Optional.of(testEquipment));

        // When
        EquipmentDTO result = equipmentService.findById(testEquipment.getId());

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(testEquipment.getId());
        assertThat(result.getSerialNumber()).isEqualTo(testEquipment.getSerialNumber());

        verify(equipmentRepository).findById(testEquipment.getId());
    }

    @Test
    void shouldThrowExceptionWhenEquipmentNotFoundById() {
        // Given
        UUID nonExistentId = UUID.randomUUID();
        when(equipmentRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> equipmentService.findById(nonExistentId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Equipamento não encontrado");

        verify(equipmentRepository).findById(nonExistentId);
    }

    @Test
    void shouldFindEquipmentBySerialNumberSuccessfully() {
        // Given
        when(equipmentRepository.findBySerialNumber(testEquipment.getSerialNumber()))
                .thenReturn(Optional.of(testEquipment));

        // When
        EquipmentDTO result = equipmentService.findBySerialNumber(testEquipment.getSerialNumber());

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getSerialNumber()).isEqualTo(testEquipment.getSerialNumber());

        verify(equipmentRepository).findBySerialNumber(testEquipment.getSerialNumber());
    }

    @Test
    void shouldFindEquipmentsByStatus() {
        // Given
        List<Equipment> equipments = Arrays.asList(testEquipment);
        when(equipmentRepository.findByStatus(EquipmentStatus.EM_ESTOQUE)).thenReturn(equipments);

        // When
        List<EquipmentDTO> result = equipmentService.findByStatus(EquipmentStatus.EM_ESTOQUE);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo(EquipmentStatus.EM_ESTOQUE);

        verify(equipmentRepository).findByStatus(EquipmentStatus.EM_ESTOQUE);
    }

    @Test
    void shouldUpdateEquipmentStatusSuccessfully() {
        // Given
        when(equipmentRepository.findById(testEquipment.getId())).thenReturn(Optional.of(testEquipment));
        when(equipmentRepository.save(any(Equipment.class))).thenReturn(testEquipment);

        // When
        EquipmentDTO result = equipmentService.updateStatus(testEquipment.getId(), EquipmentStatus.EM_USO);

        // Then
        assertThat(result).isNotNull();
        verify(equipmentRepository).findById(testEquipment.getId());
        verify(equipmentRepository).save(any(Equipment.class));
    }

    @Test
    void shouldAssignEquipmentToUserSuccessfully() {
        // Given
        UUID userId = testEmployee.getId();
        when(equipmentRepository.findById(testEquipment.getId())).thenReturn(Optional.of(testEquipment));
        when(employeeRepository.findById(userId)).thenReturn(Optional.of(testEmployee));
        when(equipmentRepository.save(any(Equipment.class))).thenReturn(testEquipment);

        // When
        EquipmentDTO result = equipmentService.assignToUser(testEquipment.getId(), userId);

        // Then
        assertThat(result).isNotNull();
        verify(equipmentRepository).findById(testEquipment.getId());
        verify(employeeRepository).findById(userId);
        verify(equipmentRepository).save(any(Equipment.class));
    }

    @Test
    void shouldUnassignEquipmentSuccessfully() {
        // Given
        testEquipment.setCurrentUserId(testEmployee.getId());
        when(equipmentRepository.findById(testEquipment.getId())).thenReturn(Optional.of(testEquipment));
        when(equipmentRepository.save(any(Equipment.class))).thenReturn(testEquipment);

        // When
        EquipmentDTO result = equipmentService.assignToUser(testEquipment.getId(), null);

        // Then
        assertThat(result).isNotNull();
        verify(equipmentRepository).findById(testEquipment.getId());
        verify(equipmentRepository).save(any(Equipment.class));
    }

    @Test
    void shouldFindExpiringEquipments() {
        // Given
        int days = 30;
        List<Equipment> equipments = Arrays.asList(testEquipment);
        when(equipmentRepository.findByValidityDateBefore(any(LocalDate.class))).thenReturn(equipments);

        // When
        List<EquipmentDTO> result = equipmentService.findExpiring(days);

        // Then
        assertThat(result).hasSize(1);
        verify(equipmentRepository).findByValidityDateBefore(any(LocalDate.class));
    }

    @Test
    void shouldFindExpiredEquipments() {
        // Given
        List<Equipment> equipments = Arrays.asList(testEquipment);
        when(equipmentRepository.findByValidityDateBefore(any(LocalDate.class))).thenReturn(equipments);

        // When
        List<EquipmentDTO> result = equipmentService.findExpired();

        // Then
        assertThat(result).hasSize(1);
        verify(equipmentRepository).findByValidityDateBefore(any(LocalDate.class));
    }

    @Test
    void shouldFindDangerousEquipments() {
        // Given
        testEquipment.setIsDangerous(true);
        List<Equipment> equipments = Arrays.asList(testEquipment);
        when(equipmentRepository.findByIsDangerousTrue()).thenReturn(equipments);

        // When
        List<EquipmentDTO> result = equipmentService.findDangerous();

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getIsDangerous()).isTrue();

        verify(equipmentRepository).findByIsDangerousTrue();
    }

    @Test
    void shouldGenerateSummarySuccessfully() {
        // Given
        when(equipmentRepository.count()).thenReturn(10L);
        when(equipmentRepository.countByStatus(EquipmentStatus.EM_USO)).thenReturn(3L);
        when(equipmentRepository.countByStatus(EquipmentStatus.EM_ESTOQUE)).thenReturn(5L);
        when(equipmentRepository.countByStatus(EquipmentStatus.EM_MANUTENCAO)).thenReturn(2L);
        when(equipmentRepository.countByIsDangerousTrue()).thenReturn(1L);
        when(equipmentRepository.countByValidityDateBefore(any(LocalDate.class))).thenReturn(0L, 2L);

        // When
        Map<String, Object> result = equipmentService.getSummary();

        // Then
        assertThat(result).isNotNull();
        assertThat(result.get("total")).isEqualTo(10L);
        assertThat(result.get("inUse")).isEqualTo(3L);
        assertThat(result.get("inStock")).isEqualTo(5L);
        assertThat(result.get("inMaintenance")).isEqualTo(2L);
        assertThat(result.get("dangerous")).isEqualTo(1L);
        assertThat(result.get("expired")).isEqualTo(0L);
        assertThat(result.get("expiringSoon")).isEqualTo(2L);

        verify(equipmentRepository).count();
        verify(equipmentRepository, times(3)).countByStatus(any(EquipmentStatus.class));
        verify(equipmentRepository).countByIsDangerousTrue();
        verify(equipmentRepository, times(2)).countByValidityDateBefore(any(LocalDate.class));
    }

    @Test
    void shouldDeleteEquipmentSuccessfully() {
        // Given
        when(equipmentRepository.findById(testEquipment.getId())).thenReturn(Optional.of(testEquipment));
        doNothing().when(equipmentRepository).delete(testEquipment);

        // When
        assertThatCode(() -> equipmentService.delete(testEquipment.getId()))
                .doesNotThrowAnyException();

        // Then
        verify(equipmentRepository).findById(testEquipment.getId());
        verify(equipmentRepository).delete(testEquipment);
    }

    @Test
    void shouldUpdateEquipmentSuccessfully() {
        // Given
        when(equipmentRepository.findById(testEquipment.getId())).thenReturn(Optional.of(testEquipment));
        when(equipmentRepository.existsBySerialNumber(createRequest.getSerialNumber())).thenReturn(false);
        when(equipmentRepository.save(any(Equipment.class))).thenReturn(testEquipment);

        // When
        EquipmentDTO result = equipmentService.update(testEquipment.getId(), createRequest);

        // Then
        assertThat(result).isNotNull();
        verify(equipmentRepository).findById(testEquipment.getId());
        verify(equipmentRepository).save(any(Equipment.class));
    }
}