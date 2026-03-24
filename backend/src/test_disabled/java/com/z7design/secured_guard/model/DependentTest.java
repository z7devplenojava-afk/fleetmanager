package com.z7design.secured_guard.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDate;
import java.util.UUID;

class DependentTest {

    private Dependent dependent;
    private Employee employee;

    @BeforeEach
    void setUp() {
        employee = new Employee();
        employee.setId(UUID.randomUUID());
        employee.setName("Test Employee");

        dependent = new Dependent();
        dependent.setId(UUID.randomUUID());
        dependent.setEmployee(employee);
        dependent.setName("Test Dependent");
        dependent.setRelationship("Child");
        dependent.setBirthDate(LocalDate.of(2010, 1, 1));
    }

    @Test
    void whenCreateDependent_thenDependentIsCreated() {
        assertNotNull(dependent);
        assertEquals(employee, dependent.getEmployee());
        assertEquals("Test Dependent", dependent.getName());
        assertEquals("Child", dependent.getRelationship());
        assertEquals(LocalDate.of(2010, 1, 1), dependent.getBirthDate());
    }

    @Test
    void whenUpdateRelationship_thenRelationshipIsUpdated() {
        dependent.setRelationship("Spouse");
        assertEquals("Spouse", dependent.getRelationship());
    }

    @Test
    void whenUpdateBirthDate_thenBirthDateIsUpdated() {
        LocalDate newDate = LocalDate.of(2012, 5, 10);
        dependent.setBirthDate(newDate);
        assertEquals(newDate, dependent.getBirthDate());
    }
} 