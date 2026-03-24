package com.z7design.secured_guard.service;

import com.z7design.secured_guard.exception.ResourceNotFoundException;
import com.z7design.secured_guard.model.Employee;
import com.z7design.secured_guard.model.Unit;
import com.z7design.secured_guard.repository.UnitRepository;
import com.z7design.secured_guard.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UnitServiceTest {

    @Mock
    private UnitRepository unitRepository;

    @InjectMocks
    private UnitService unitService;

    private Unit unit;
    private Unit parentUnit;
    private UUID unitId;
    private UUID parentId;
    private Employee employee;

    @BeforeEach
    void setUp() {
        unitId = UUID.randomUUID();
        parentId = UUID.randomUUID();

        parentUnit = Unit.builder()
                .id(parentId)
                .name("Parent Unit")
                .build();

        unit = Unit.builder()
                .id(unitId)
                .name("Test Unit")
                .description("Test Description")
                .address("Test Address")
                .phone("123456789")
                .email("test@example.com")
                .parent(parentUnit)
                .build();
        unit.setEmployees(new java.util.ArrayList<>());

        employee = new Employee();
        employee.setId(UUID.randomUUID());
        employee.setName("Test Employee");
    }

    @Test
    void whenCreateUnit_thenUnitIsCreated() {
        when(unitRepository.existsByName(unit.getName())).thenReturn(false);
        when(unitRepository.existsByEmail(unit.getEmail())).thenReturn(false);
        when(unitRepository.save(any(Unit.class))).thenReturn(unit);

        Unit createdUnit = unitService.create(unit);

        assertNotNull(createdUnit);
        assertEquals(unit.getName(), createdUnit.getName());
        assertEquals(unit.getEmail(), createdUnit.getEmail());
        verify(unitRepository).save(unit);
    }

    @Test
    void whenCreateUnitWithExistingName_thenThrowsException() {
        when(unitRepository.existsByName(unit.getName())).thenReturn(true);

        assertThrows(BusinessException.class, () -> unitService.create(unit));
        verify(unitRepository, never()).save(any(Unit.class));
    }

    @Test
    void whenCreateUnitWithExistingEmail_thenThrowsException() {
        when(unitRepository.existsByName(unit.getName())).thenReturn(false);
        when(unitRepository.existsByEmail(unit.getEmail())).thenReturn(true);

        assertThrows(BusinessException.class, () -> unitService.create(unit));
        verify(unitRepository, never()).save(any(Unit.class));
    }

    @Test
    void whenCreateUnitWithoutRequiredFields_thenThrowsException() {
        Unit invalidUnit = Unit.builder().build();

        assertThrows(BusinessException.class, () -> unitService.create(invalidUnit));
        verify(unitRepository, never()).save(any(Unit.class));
    }

    @Test
    void whenUpdateUnit_thenUnitIsUpdated() {
        when(unitRepository.findById(unitId)).thenReturn(Optional.of(unit));
        when(unitRepository.existsByName(anyString())).thenReturn(false);
        when(unitRepository.existsByEmail(anyString())).thenReturn(false);
        when(unitRepository.save(any(Unit.class))).thenReturn(unit);

        Unit updatedUnit = unitService.update(unitId, unit);

        assertNotNull(updatedUnit);
        assertEquals(unitId, updatedUnit.getId());
        verify(unitRepository).save(unit);
    }

    @Test
    void whenUpdateNonExistentUnit_thenThrowsException() {
        when(unitRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> unitService.update(UUID.randomUUID(), unit));
        verify(unitRepository, never()).save(any(Unit.class));
    }

    @Test
    void whenUpdateUnitWithExistingName_thenThrowsException() {
        when(unitRepository.findById(unitId)).thenReturn(Optional.of(unit));
        when(unitRepository.existsByName(anyString())).thenReturn(true);

        assertThrows(BusinessException.class, () -> unitService.update(unitId, unit));
        verify(unitRepository, never()).save(any(Unit.class));
    }

    @Test
    void whenUpdateUnitWithExistingEmail_thenThrowsException() {
        when(unitRepository.findById(unitId)).thenReturn(Optional.of(unit));
        when(unitRepository.existsByName(anyString())).thenReturn(false);
        when(unitRepository.existsByEmail(anyString())).thenReturn(true);

        assertThrows(BusinessException.class, () -> unitService.update(unitId, unit));
        verify(unitRepository, never()).save(any(Unit.class));
    }

    @Test
    void whenDeleteUnit_thenUnitIsDeleted() {
        when(unitRepository.findById(unitId)).thenReturn(Optional.of(unit));
        unit.setEmployees(Collections.emptyList());
        doNothing().when(unitRepository).delete(unit);

        unitService.delete(unitId);

        verify(unitRepository).delete(unit);
    }

    @Test
    void whenDeleteNonExistentUnit_thenThrowsException() {
        when(unitRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> unitService.delete(UUID.randomUUID()));
        verify(unitRepository, never()).delete(any(Unit.class));
    }

    @Test
    void whenDeleteUnitWithEmployees_thenThrowsException() {
        when(unitRepository.findById(unitId)).thenReturn(Optional.of(unit));
        unit.setEmployees(Arrays.asList(employee));

        assertThrows(BusinessException.class, () -> unitService.delete(unitId));
        verify(unitRepository, never()).delete(any(Unit.class));
    }

    @Test
    void whenFindById_thenReturnsUnit() {
        when(unitRepository.findById(unitId)).thenReturn(Optional.of(unit));

        Unit foundUnit = unitService.findById(unitId);

        assertNotNull(foundUnit);
        assertEquals(unitId, foundUnit.getId());
    }

    @Test
    void whenFindByNonExistentId_thenThrowsException() {
        when(unitRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> unitService.findById(UUID.randomUUID()));
    }

    @Test
    void whenFindByName_thenReturnsUnit() {
        when(unitRepository.findByName(unit.getName())).thenReturn(Optional.of(unit));

        Unit foundUnit = unitService.findByName(unit.getName());

        assertNotNull(foundUnit);
        assertEquals(unit.getName(), foundUnit.getName());
    }

    @Test
    void whenFindByNonExistentName_thenThrowsException() {
        when(unitRepository.findByName(anyString())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> unitService.findByName("Non Existent"));
    }

    @Test
    void whenFindByEmail_thenReturnsUnit() {
        when(unitRepository.findByEmail(unit.getEmail())).thenReturn(Optional.of(unit));

        Unit foundUnit = unitService.findByEmail(unit.getEmail());

        assertNotNull(foundUnit);
        assertEquals(unit.getEmail(), foundUnit.getEmail());
    }

    @Test
    void whenFindByNonExistentEmail_thenThrowsException() {
        when(unitRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> unitService.findByEmail("nonexistent@example.com"));
    }

    @Test
    void whenFindByAddress_thenReturnsUnits() {
        List<Unit> units = Arrays.asList(unit);
        when(unitRepository.findByAddressContaining(unit.getAddress())).thenReturn(units);

        List<Unit> foundUnits = unitService.findByAddressContaining(unit.getAddress());

        assertNotNull(foundUnits);
        assertEquals(1, foundUnits.size());
        assertEquals(unit.getAddress(), foundUnits.get(0).getAddress());
    }

    @Test
    void whenFindByParentId_thenReturnsUnits() {
        List<Unit> units = Arrays.asList(unit);
        when(unitRepository.findByParentId(parentId)).thenReturn(units);

        List<Unit> foundUnits = unitService.findByParentId(parentId);

        assertNotNull(foundUnits);
        assertEquals(1, foundUnits.size());
        assertEquals(parentId, foundUnits.get(0).getParent().getId());
    }

    @Test
    void whenFindAll_thenReturnsAllUnits() {
        List<Unit> units = Arrays.asList(unit);
        when(unitRepository.findAll()).thenReturn(units);

        List<Unit> foundUnits = unitService.findAll();

        assertNotNull(foundUnits);
        assertEquals(1, foundUnits.size());
        assertEquals(unit.getId(), foundUnits.get(0).getId());
    }

    @Test
    @Transactional
    void whenCreateUnitWithParent_thenParentChildRelationshipIsEstablished() {
        when(unitRepository.existsByName(unit.getName())).thenReturn(false);
        when(unitRepository.existsByEmail(unit.getEmail())).thenReturn(false);
        when(unitRepository.save(any(Unit.class))).thenReturn(unit);
        when(unitRepository.findById(parentId)).thenReturn(Optional.of(parentUnit));

        Unit createdUnit = unitService.create(unit);

        assertNotNull(createdUnit);
        assertEquals(parentId, createdUnit.getParent().getId());
        verify(unitRepository).save(unit);
    }
} 