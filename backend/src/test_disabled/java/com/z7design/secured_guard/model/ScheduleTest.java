package com.z7design.secured_guard.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDate;
import java.util.UUID;

import com.z7design.secured_guard.model.enums.ScheduleStatus;
import com.z7design.secured_guard.model.enums.Shift;

class ScheduleTest {

    private Schedule schedule;
    private Employee employee;
    private Location location;
    private Route route;
    private Patrol patrol;

    @BeforeEach
    void setUp() {
        employee = new Employee();
        employee.setId(UUID.randomUUID());
        employee.setName("Test Employee");

        location = Location.builder()
                .id(UUID.randomUUID())
                .name("Test Location")
                .build();

        route = new Route();
        route.setId(UUID.randomUUID());
        route.setName("Test Route");

        patrol = new Patrol();
        patrol.setId(UUID.randomUUID());
        patrol.setEmployee(employee);
        patrol.setRoute(route);

        schedule = Schedule.builder()
                .id(UUID.randomUUID())
                .scheduleDate(LocalDate.now())
                .shift(Shift.MORNING)
                .location(location)
                .status(ScheduleStatus.PENDING)
                .route(route)
                .patrol(patrol)
                .observations("Test observations")
                .build();
    }

    @Test
    void whenCreateSchedule_thenScheduleIsCreated() {
        assertNotNull(schedule);
        assertEquals(LocalDate.now(), schedule.getScheduleDate());
        assertEquals(Shift.MORNING, schedule.getShift());
        assertEquals(location, schedule.getLocation());
        assertEquals(ScheduleStatus.PENDING, schedule.getStatus());
        assertEquals(route, schedule.getRoute());
        assertEquals(patrol, schedule.getPatrol());
        assertEquals("Test observations", schedule.getObservations());
    }

    @Test
    void whenUpdateScheduleStatus_thenStatusIsUpdated() {
        schedule.setStatus(ScheduleStatus.IN_PROGRESS);
        assertEquals(ScheduleStatus.IN_PROGRESS, schedule.getStatus());

        schedule.setStatus(ScheduleStatus.COMPLETED);
        assertEquals(ScheduleStatus.COMPLETED, schedule.getStatus());
    }

    @Test
    void whenUpdateScheduleShift_thenShiftIsUpdated() {
        schedule.setShift(Shift.AFTERNOON);
        assertEquals(Shift.AFTERNOON, schedule.getShift());

        schedule.setShift(Shift.NIGHT);
        assertEquals(Shift.NIGHT, schedule.getShift());
    }

    @Test
    void whenUpdateScheduleLocation_thenLocationIsUpdated() {
        Location newLocation = Location.builder()
                .id(UUID.randomUUID())
                .name("New Location")
                .build();

        schedule.setLocation(newLocation);
        assertEquals(newLocation, schedule.getLocation());
    }
} 