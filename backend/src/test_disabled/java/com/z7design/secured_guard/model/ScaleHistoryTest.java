package com.z7design.secured_guard.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import com.z7design.secured_guard.model.enums.ScheduleStatus;
import com.z7design.secured_guard.model.enums.Shift;

class ScaleHistoryTest {

    private ScaleHistory scaleHistory;
    private Employee employee;

    @BeforeEach
    void setUp() {
        employee = new Employee();
        employee.setId(UUID.randomUUID());
        employee.setName("Test Employee");

        scaleHistory = new ScaleHistory();
        scaleHistory.setId(UUID.randomUUID());
        scaleHistory.setEmployee(employee);
        scaleHistory.setDate(LocalDate.now());
        scaleHistory.setShift(Shift.MORNING);
        scaleHistory.setStatus(ScheduleStatus.PENDING);
        scaleHistory.setNotes("Test notes");
    }

    @Test
    void whenCreateScaleHistory_thenScaleHistoryIsCreated() {
        assertNotNull(scaleHistory);
        assertEquals(employee, scaleHistory.getEmployee());
        assertEquals(LocalDate.now(), scaleHistory.getDate());
        assertEquals(Shift.MORNING, scaleHistory.getShift());
        assertEquals(ScheduleStatus.PENDING, scaleHistory.getStatus());
        assertEquals("Test notes", scaleHistory.getNotes());
        assertNotNull(scaleHistory.getCreatedAt());
        assertNotNull(scaleHistory.getUpdatedAt());
    }

    @Test
    void whenUpdateShift_thenShiftIsUpdated() {
        scaleHistory.setShift(Shift.AFTERNOON);
        assertEquals(Shift.AFTERNOON, scaleHistory.getShift());
    }

    @Test
    void whenUpdateStatus_thenStatusIsUpdated() {
        scaleHistory.setStatus(ScheduleStatus.IN_PROGRESS);
        assertEquals(ScheduleStatus.IN_PROGRESS, scaleHistory.getStatus());
    }

    @Test
    void whenUpdateNotes_thenNotesAreUpdated() {
        String newNotes = "Updated notes";
        scaleHistory.setNotes(newNotes);
        assertEquals(newNotes, scaleHistory.getNotes());
    }
} 