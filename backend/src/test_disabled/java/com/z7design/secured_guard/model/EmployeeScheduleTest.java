package com.z7design.secured_guard.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.util.UUID;

class EmployeeScheduleTest {

    private EmployeeSchedule employeeSchedule;
    private Schedule schedule;
    private Employee employee;
    private Position position;

    @BeforeEach
    void setUp() {
        schedule = new Schedule();
        schedule.setId(UUID.randomUUID());

        employee = new Employee();
        employee.setId(UUID.randomUUID());
        employee.setName("Test Employee");

        position = new Position();
        position.setId(UUID.randomUUID());
        position.setName("Test Position");

        employeeSchedule = new EmployeeSchedule();
        employeeSchedule.setId(UUID.randomUUID());
        employeeSchedule.setSchedule(schedule);
        employeeSchedule.setEmployee(employee);
        employeeSchedule.setPosition(position);
    }

    @Test
    void whenCreateEmployeeSchedule_thenEmployeeScheduleIsCreated() {
        assertNotNull(employeeSchedule);
        assertEquals(schedule, employeeSchedule.getSchedule());
        assertEquals(employee, employeeSchedule.getEmployee());
        assertEquals(position, employeeSchedule.getPosition());
    }
} 