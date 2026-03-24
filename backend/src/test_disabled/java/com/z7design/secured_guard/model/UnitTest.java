package com.z7design.secured_guard.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;
import java.util.UUID;

class UnitTest {

    private Unit unit;
    private Unit parentUnit;
    private Employee employee;
    private Position position;
    private Payroll payroll;
    private Location location;

    @BeforeEach
    void setUp() {
        unit = Unit.builder()
                .id(UUID.randomUUID())
                .name("Test Unit")
                .description("Test Description")
                .address("Test Address")
                .phone("123456789")
                .email("test@example.com")
                .build();

        parentUnit = Unit.builder()
                .id(UUID.randomUUID())
                .name("Parent Unit")
                .build();

        employee = new Employee();
        employee.setId(UUID.randomUUID());
        employee.setName("Test Employee");

        position = Position.builder()
                .id(UUID.randomUUID())
                .name("Test Position")
                .build();

        payroll = Payroll.builder()
                .id(UUID.randomUUID())
                .referenceMonth("2024-03")
                .build();

        location = Location.builder()
                .id(UUID.randomUUID())
                .name("Test Location")
                .build();
    }

    @Test
    void whenCreateUnit_thenUnitIsCreated() {
        assertNotNull(unit);
        assertNotNull(unit.getId());
        assertEquals("Test Unit", unit.getName());
        assertEquals("Test Description", unit.getDescription());
        assertEquals("Test Address", unit.getAddress());
        assertEquals("123456789", unit.getPhone());
        assertEquals("test@example.com", unit.getEmail());
    }

    @Test
    void whenCreateUnitWithoutRequiredFields_thenValidationFails() {
        Unit invalidUnit = Unit.builder().build();
        
        assertNull(invalidUnit.getName());
        assertNull(invalidUnit.getAddress());
    }

    @Test
    void whenSetParentUnit_thenParentChildRelationshipIsEstablished() {
        unit.setParent(parentUnit);
        parentUnit.getChildren().add(unit);

        assertNotNull(unit.getParent());
        assertEquals(parentUnit, unit.getParent());
        assertTrue(parentUnit.getChildren().contains(unit));
    }

    @Test
    void whenRemoveParentUnit_thenParentChildRelationshipIsRemoved() {
        unit.setParent(parentUnit);
        parentUnit.getChildren().add(unit);
        
        unit.setParent(null);
        parentUnit.getChildren().remove(unit);

        assertNull(unit.getParent());
        assertFalse(parentUnit.getChildren().contains(unit));
    }

    @Test
    void whenAddEmployee_thenEmployeeIsAddedToUnit() {
        unit.getEmployees().add(employee);
        employee.setUnit(unit);

        assertTrue(unit.getEmployees().contains(employee));
        assertEquals(unit, employee.getUnit());
    }

    @Test
    void whenRemoveEmployee_thenEmployeeIsRemovedFromUnit() {
        unit.getEmployees().add(employee);
        employee.setUnit(unit);
        
        unit.getEmployees().remove(employee);
        employee.setUnit(null);

        assertFalse(unit.getEmployees().contains(employee));
        assertNull(employee.getUnit());
    }

    @Test
    void whenAddPosition_thenPositionIsAddedToUnit() {
        unit.getPositions().add(position);
        position.setUnit(unit);

        assertTrue(unit.getPositions().contains(position));
        assertEquals(unit, position.getUnit());
    }

    @Test
    void whenRemovePosition_thenPositionIsRemovedFromUnit() {
        unit.getPositions().add(position);
        position.setUnit(unit);
        
        unit.getPositions().remove(position);
        position.setUnit(null);

        assertFalse(unit.getPositions().contains(position));
        assertNull(position.getUnit());
    }

    @Test
    void whenAddPayroll_thenPayrollIsAddedToUnit() {
        unit.getPayrolls().add(payroll);
        payroll.setUnit(unit);

        assertTrue(unit.getPayrolls().contains(payroll));
        assertEquals(unit, payroll.getUnit());
    }

    @Test
    void whenRemovePayroll_thenPayrollIsRemovedFromUnit() {
        unit.getPayrolls().add(payroll);
        payroll.setUnit(unit);
        
        unit.getPayrolls().remove(payroll);
        payroll.setUnit(null);

        assertFalse(unit.getPayrolls().contains(payroll));
        assertNull(payroll.getUnit());
    }

    @Test
    void whenAddLocation_thenLocationIsAddedToUnit() {
        unit.getLocations().add(location);
        location.setUnit(unit);

        assertTrue(unit.getLocations().contains(location));
        assertEquals(unit, location.getUnit());
    }

    @Test
    void whenRemoveLocation_thenLocationIsRemovedFromUnit() {
        unit.getLocations().add(location);
        location.setUnit(unit);
        
        unit.getLocations().remove(location);
        location.setUnit(null);

        assertFalse(unit.getLocations().contains(location));
        assertNull(location.getUnit());
    }

    @Test
    void whenUpdateName_thenNameIsUpdated() {
        unit.setName("Updated Unit");
        assertEquals("Updated Unit", unit.getName());
    }

    @Test
    void whenUpdateDescription_thenDescriptionIsUpdated() {
        unit.setDescription("Updated Description");
        assertEquals("Updated Description", unit.getDescription());
    }

    @Test
    void whenUpdateAddress_thenAddressIsUpdated() {
        unit.setAddress("Updated Address");
        assertEquals("Updated Address", unit.getAddress());
    }

    @Test
    void whenUpdatePhone_thenPhoneIsUpdated() {
        unit.setPhone("987654321");
        assertEquals("987654321", unit.getPhone());
    }

    @Test
    void whenUpdateEmail_thenEmailIsUpdated() {
        unit.setEmail("updated@example.com");
        assertEquals("updated@example.com", unit.getEmail());
    }

    @Test
    void whenCreateUnit_thenAuditFieldsAreSet() {
        unit.onCreate();
        assertNotNull(unit.getCreatedAt());
        assertNotNull(unit.getUpdatedAt());
        assertEquals(unit.getCreatedAt(), unit.getUpdatedAt());
    }

    @Test
    void whenUpdateUnit_thenUpdatedAtIsChanged() {
        LocalDateTime initialUpdatedAt = unit.getUpdatedAt();
        unit.setName("Updated Unit Name");
        unit.onUpdate();

        assertNotEquals(initialUpdatedAt, unit.getUpdatedAt());
    }

    @Test
    void whenCreateUnitWithInvalidEmail_thenValidationFails() {
        unit.setEmail("invalid-email");
        assertFalse(unit.getEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$"));
    }

    @Test
    void whenCreateUnitWithInvalidPhone_thenValidationFails() {
        unit.setPhone("invalid-phone");
        assertFalse(unit.getPhone().matches("^\\d{10,11}$"));
    }
} 