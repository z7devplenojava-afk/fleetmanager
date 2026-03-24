package com.z7design.secured_guard.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;
import java.util.UUID;

class OccurrenceTest {

    private Occurrence occurrence;
    private Employee employee;

    @BeforeEach
    void setUp() {
        employee = new Employee();
        employee.setId(UUID.randomUUID());
        employee.setName("Test Employee");

        occurrence = new Occurrence();
        occurrence.setId(UUID.randomUUID());
        occurrence.setEmployee(employee);
        occurrence.setType(OccurrenceType.ATESTADO);
        occurrence.setDescription("Minor accident");
        occurrence.setOccurrenceDate(LocalDateTime.now());
    }

    @Test
    void whenCreateOccurrence_thenOccurrenceIsCreated() {
        assertNotNull(occurrence);
        assertEquals(employee, occurrence.getEmployee());
        assertEquals(OccurrenceType.ATESTADO, occurrence.getType());
        assertEquals("Minor accident", occurrence.getDescription());
        assertNotNull(occurrence.getOccurrenceDate());
    }

    @Test
    void whenUpdateType_thenTypeIsUpdated() {
        occurrence.setType(OccurrenceType.ADVERTENCIA);
        assertEquals(OccurrenceType.ADVERTENCIA, occurrence.getType());
    }

    @Test
    void whenUpdateDescription_thenDescriptionIsUpdated() {
        occurrence.setDescription("Updated description");
        assertEquals("Updated description", occurrence.getDescription());
    }
} 