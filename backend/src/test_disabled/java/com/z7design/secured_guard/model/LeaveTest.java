package com.z7design.secured_guard.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import com.z7design.secured_guard.model.enums.LeaveStatus;
import com.z7design.secured_guard.model.enums.LeaveType;

class LeaveTest {

    private Leave leave;
    private Employee employee;
    private User approver;

    @BeforeEach
    void setUp() {
        employee = new Employee();
        employee.setId(UUID.randomUUID());
        employee.setName("Test Employee");

        approver = new User();
        approver.setId(UUID.randomUUID());
        approver.setUsername("approver");
        approver.setName("Test Approver");

        leave = Leave.builder()
                .id(UUID.randomUUID())
                .employee(employee)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(5))
                .type(LeaveType.FERIAS)
                .reason("Vacation")
                .justification("Annual leave")
                .documentUrl("http://example.com/leave.pdf")
                .status(LeaveStatus.PENDENTE)
                .build();
    }

    @Test
    void whenCreateLeave_thenLeaveIsCreated() {
        assertNotNull(leave);
        assertEquals(employee, leave.getEmployee());
        assertEquals(LocalDate.now(), leave.getStartDate());
        assertEquals(LocalDate.now().plusDays(5), leave.getEndDate());
        assertEquals(LeaveType.FERIAS, leave.getType());
        assertEquals("Vacation", leave.getReason());
        assertEquals("Annual leave", leave.getJustification());
        assertEquals("http://example.com/leave.pdf", leave.getDocumentUrl());
        assertEquals(LeaveStatus.PENDENTE, leave.getStatus());
    }

    @Test
    void whenApproveLeave_thenStatusIsUpdated() {
        leave.setStatus(LeaveStatus.APROVADO);
        leave.setApprovedBy(approver);
        leave.setApprovalDate(LocalDateTime.now());

        assertEquals(LeaveStatus.APROVADO, leave.getStatus());
        assertEquals(approver, leave.getApprovedBy());
        assertNotNull(leave.getApprovalDate());
    }

    @Test
    void whenRejectLeave_thenStatusIsUpdated() {
        leave.setStatus(LeaveStatus.REJEITADO);
        leave.setApprovedBy(approver);
        leave.setApprovalDate(LocalDateTime.now());

        assertEquals(LeaveStatus.REJEITADO, leave.getStatus());
        assertEquals(approver, leave.getApprovedBy());
        assertNotNull(leave.getApprovalDate());
    }

    @Test
    void whenUpdateLeaveDates_thenDatesAreUpdated() {
        LocalDate newStartDate = LocalDate.now().plusDays(10);
        LocalDate newEndDate = LocalDate.now().plusDays(15);
        leave.setStartDate(newStartDate);
        leave.setEndDate(newEndDate);

        assertEquals(newStartDate, leave.getStartDate());
        assertEquals(newEndDate, leave.getEndDate());
    }
} 