package com.z7design.secured_guard.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import com.z7design.secured_guard.model.enums.OvertimeStatus;
import com.z7design.secured_guard.model.enums.OvertimeType;

class OvertimeTest {

    private Overtime overtime;
    private Employee employee;

    @BeforeEach
    void setUp() {
        employee = new Employee();
        employee.setId(UUID.randomUUID());
        employee.setName("Test Employee");

        overtime = new Overtime();
        overtime.setId(UUID.randomUUID());
        overtime.setEmployee(employee);
        overtime.setOvertimeDate(LocalDate.now());
        overtime.setStartTime(LocalTime.of(18, 0));
        overtime.setEndTime(LocalTime.of(20, 30));
        overtime.setTotalHours(2.5);
        overtime.setType(OvertimeType.EXTRA);
        overtime.setReason("Extra work");
        overtime.setStatus(OvertimeStatus.PENDING);
    }

    @Test
    void whenCreateOvertime_thenOvertimeIsCreated() {
        assertNotNull(overtime);
        assertEquals(employee, overtime.getEmployee());
        assertEquals(LocalDate.now(), overtime.getOvertimeDate());
        assertEquals(LocalTime.of(18, 0), overtime.getStartTime());
        assertEquals(LocalTime.of(20, 30), overtime.getEndTime());
        assertEquals(2.5, overtime.getTotalHours());
        assertEquals(OvertimeType.EXTRA, overtime.getType());
        assertEquals("Extra work", overtime.getReason());
        assertEquals(OvertimeStatus.PENDING, overtime.getStatus());
    }

    @Test
    void whenUpdateHours_thenHoursIsUpdated() {
        overtime.setTotalHours(3.0);
        assertEquals(3.0, overtime.getTotalHours());
    }

    @Test
    void whenUpdateReason_thenReasonIsUpdated() {
        overtime.setReason("Updated reason");
        assertEquals("Updated reason", overtime.getReason());
    }
} 