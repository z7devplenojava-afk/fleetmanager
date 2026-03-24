package com.z7design.secured_guard.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;
import java.util.UUID;

class PatrolTest {

    private Patrol patrol;
    private Route route;
    private Employee employee;

    @BeforeEach
    void setUp() {
        route = new Route();
        route.setId(UUID.randomUUID());
        route.setName("Test Route");

        employee = new Employee();
        employee.setId(UUID.randomUUID());
        employee.setName("Test Employee");

        patrol = new Patrol();
        patrol.setId(UUID.randomUUID());
        patrol.setRoute(route);
        patrol.setEmployee(employee);
        patrol.setStartTime(LocalDateTime.now());
        patrol.setObservations("Test observations");
    }

    @Test
    void whenCreatePatrol_thenPatrolIsCreated() {
        assertNotNull(patrol);
        assertEquals(route, patrol.getRoute());
        assertEquals(employee, patrol.getEmployee());
        assertNotNull(patrol.getStartTime());
        assertEquals("Test observations", patrol.getObservations());
    }

    @Test
    void whenSetEndTime_thenEndTimeIsUpdated() {
        LocalDateTime endTime = LocalDateTime.now().plusHours(2);
        patrol.setEndTime(endTime);
        assertEquals(endTime, patrol.getEndTime());
    }

    @Test
    void whenUpdateObservations_thenObservationsAreUpdated() {
        String newObservations = "Updated observations";
        patrol.setObservations(newObservations);
        assertEquals(newObservations, patrol.getObservations());
    }
} 