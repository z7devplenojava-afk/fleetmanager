package com.z7design.secured_guard.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;
import java.util.UUID;

class EPITest {

    private EPI epi;
    private Employee employee;

    @BeforeEach
    void setUp() {
        employee = new Employee();
        employee.setId(UUID.randomUUID());
        employee.setName("Test Employee");

        epi = new EPI();
        epi.setId(UUID.randomUUID());
        epi.setEmployee(employee);
        epi.setName("Helmet");
        epi.setDescription("Protective helmet");
        epi.setIssueDate(LocalDateTime.now());
        epi.setExpirationDate(LocalDateTime.now().plusYears(2));
    }

    @Test
    void whenCreateEPI_thenEPIIsCreated() {
        assertNotNull(epi);
        assertEquals(employee, epi.getEmployee());
        assertEquals("Helmet", epi.getName());
        assertEquals("Protective helmet", epi.getDescription());
        assertNotNull(epi.getIssueDate());
        assertNotNull(epi.getExpirationDate());
    }

    @Test
    void whenUpdateDescription_thenDescriptionIsUpdated() {
        epi.setDescription("Updated description");
        assertEquals("Updated description", epi.getDescription());
    }

    @Test
    void whenUpdateExpirationDate_thenExpirationDateIsUpdated() {
        LocalDateTime newDate = LocalDateTime.now().plusYears(3);
        epi.setExpirationDate(newDate);
        assertEquals(newDate, epi.getExpirationDate());
    }
} 