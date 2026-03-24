package com.z7design.secured_guard.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDate;
import java.util.UUID;

import com.z7design.secured_guard.model.enums.VacationStatus;

class VacationTest {

    private Vacation vacation;
    private Employee employee;

    @BeforeEach
    void setUp() {
        employee = new Employee();
        employee.setId(UUID.randomUUID());
        employee.setName("Test Employee");

        vacation = new Vacation();
        vacation.setId(UUID.randomUUID());
        vacation.setEmployee(employee);
        vacation.setStartDate(LocalDate.now());
        vacation.setEndDate(LocalDate.now().plusDays(10));
        vacation.setDaysTaken(10);
        vacation.setRemainingDays(20);
        vacation.setStatus(VacationStatus.PENDING);
    }

    @Test
    void whenCreateVacation_thenVacationIsCreated() {
        assertNotNull(vacation);
        assertEquals(employee, vacation.getEmployee());
        assertEquals(LocalDate.now(), vacation.getStartDate());
        assertEquals(LocalDate.now().plusDays(10), vacation.getEndDate());
        assertEquals(10, vacation.getDaysTaken());
        assertEquals(20, vacation.getRemainingDays());
        assertEquals(VacationStatus.PENDING, vacation.getStatus());
    }

    @Test
    void whenUpdateEndDate_thenEndDateIsUpdated() {
        LocalDate newEndDate = LocalDate.now().plusDays(15);
        vacation.setEndDate(newEndDate);
        assertEquals(newEndDate, vacation.getEndDate());
    }

    @Test
    void whenUpdateStatus_thenStatusIsUpdated() {
        vacation.setStatus(VacationStatus.APPROVED);
        assertEquals(VacationStatus.APPROVED, vacation.getStatus());
    }
} 