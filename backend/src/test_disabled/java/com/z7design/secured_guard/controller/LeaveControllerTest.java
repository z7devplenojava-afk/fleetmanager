package com.z7design.secured_guard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.secured_guard.dto.ErrorResponse;
import com.z7design.secured_guard.model.Employee;
import com.z7design.secured_guard.model.Leave;
import com.z7design.secured_guard.model.User;
import com.z7design.secured_guard.model.enums.LeaveStatus;
import com.z7design.secured_guard.model.enums.LeaveType;
import com.z7design.secured_guard.service.LeaveService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(LeaveController.class)
public class LeaveControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private LeaveService leaveService;

    @Autowired
    private ObjectMapper objectMapper;

    private Leave leave;
    private UUID leaveId;
    private Employee employee;

    @BeforeEach
    void setUp() {
        leaveId = UUID.randomUUID();
        employee = new Employee();
        employee.setId(UUID.randomUUID());

        leave = new Leave();
        leave.setId(leaveId);
        leave.setEmployee(employee);
        leave.setType(LeaveType.FERIAS);
        leave.setStartDate(LocalDate.now());
        leave.setEndDate(LocalDate.now().plusDays(10));
        leave.setReason("Annual leave");
        leave.setStatus(LeaveStatus.PENDENTE);
    }

    @Test
    @DisplayName("Should create a new leave request successfully")
    void shouldCreateLeaveSuccessfully() throws Exception {
        when(leaveService.create(any(Leave.class))).thenReturn(leave);

        mockMvc.perform(post("/api/leaves")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(leave)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(leave.getId().toString()))
                .andExpect(jsonPath("$.reason").value(leave.getReason()));

        verify(leaveService, times(1)).create(any(Leave.class));
    }

    @Test
    @DisplayName("Should return 400 when creating leave with invalid data")
    void shouldReturnBadRequestWhenCreatingLeaveWithInvalidData() throws Exception {
        Leave invalidLeave = new Leave(); // Missing required fields

        mockMvc.perform(post("/api/leaves")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidLeave)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.timestamp").isNotEmpty());

        verify(leaveService, never()).create(any(Leave.class));
    }

    @Test
    @DisplayName("Should update an existing leave request successfully")
    void shouldUpdateLeaveSuccessfully() throws Exception {
        Leave updatedLeave = new Leave();
        updatedLeave.setId(leaveId);
        updatedLeave.setEmployee(employee);
        updatedLeave.setType(LeaveType.LICENCA_MEDICA);
        updatedLeave.setStartDate(LocalDate.now().minusDays(5));
        updatedLeave.setEndDate(LocalDate.now().plusDays(5));
        updatedLeave.setReason("Sick leave updated");
        updatedLeave.setStatus(LeaveStatus.APROVADO);

        when(leaveService.update(eq(leaveId), any(Leave.class))).thenReturn(updatedLeave);

        mockMvc.perform(put("/api/leaves/{id}", leaveId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedLeave)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(updatedLeave.getId().toString()))
                .andExpect(jsonPath("$.reason").value(updatedLeave.getReason()));

        verify(leaveService, times(1)).update(eq(leaveId), any(Leave.class));
    }

    @Test
    @DisplayName("Should return 404 when updating a non-existent leave request")
    void shouldReturnNotFoundWhenUpdatingNonExistentLeave() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(leaveService.update(eq(nonExistentId), any(Leave.class)))
                .thenThrow(new com.z7design.secured_guard.exception.ResourceNotFoundException("Leave not found"));

        mockMvc.perform(put("/api/leaves/{id}", nonExistentId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(leave)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Leave not found"));

        verify(leaveService, times(1)).update(eq(nonExistentId), any(Leave.class));
    }

    @Test
    @DisplayName("Should approve a leave request successfully")
    void shouldApproveLeaveSuccessfully() throws Exception {
        UUID approvedBy = UUID.randomUUID();
        Leave approvedLeave = leave;
        approvedLeave.setStatus(LeaveStatus.APROVADO);
        when(leaveService.approve(eq(leaveId), eq(approvedBy))).thenReturn(approvedLeave);

        mockMvc.perform(put("/api/leaves/{id}/approve", leaveId)
                .param("approvedBy", approvedBy.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(LeaveStatus.APROVADO.name()));

        verify(leaveService, times(1)).approve(eq(leaveId), eq(approvedBy));
    }

    @Test
    @DisplayName("Should reject a leave request successfully")
    void shouldRejectLeaveSuccessfully() throws Exception {
        String justification = "Not enough staff";
        Leave rejectedLeave = leave;
        rejectedLeave.setStatus(LeaveStatus.REJEITADO);
        rejectedLeave.setJustification(justification);
        when(leaveService.reject(eq(leaveId), eq(justification))).thenReturn(rejectedLeave);

        mockMvc.perform(put("/api/leaves/{id}/reject", leaveId)
                .param("justification", justification))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(LeaveStatus.REJEITADO.name()))
                .andExpect(jsonPath("$.justification").value(justification));

        verify(leaveService, times(1)).reject(eq(leaveId), eq(justification));
    }

    @Test
    @DisplayName("Should cancel a leave request successfully")
    void shouldCancelLeaveSuccessfully() throws Exception {
        Leave canceledLeave = leave;
        canceledLeave.setStatus(LeaveStatus.CANCELADO);
        when(leaveService.cancel(eq(leaveId))).thenReturn(canceledLeave);

        mockMvc.perform(put("/api/leaves/{id}/cancel", leaveId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(LeaveStatus.CANCELADO.name()));

        verify(leaveService, times(1)).cancel(eq(leaveId));
    }

    @Test
    @DisplayName("Should find leave request by ID successfully")
    void shouldFindLeaveByIdSuccessfully() throws Exception {
        when(leaveService.findById(leaveId)).thenReturn(leave);

        mockMvc.perform(get("/api/leaves/{id}", leaveId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(leaveId.toString()))
                .andExpect(jsonPath("$.reason").value(leave.getReason()));

        verify(leaveService, times(1)).findById(leaveId);
    }

    @Test
    @DisplayName("Should return 404 when finding non-existent leave request by ID")
    void shouldReturnNotFoundWhenFindingNonExistentLeaveById() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(leaveService.findById(nonExistentId))
                .thenThrow(new com.z7design.secured_guard.exception.ResourceNotFoundException("Leave not found"));

        mockMvc.perform(get("/api/leaves/{id}", nonExistentId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Leave not found"));

        verify(leaveService, times(1)).findById(nonExistentId);
    }

    @Test
    @DisplayName("Should find leave requests by employee ID successfully")
    void shouldFindLeavesByEmployeeIdSuccessfully() throws Exception {
        UUID employeeId = UUID.randomUUID();
        when(leaveService.findByEmployeeId(employeeId)).thenReturn(Collections.singletonList(leave));

        mockMvc.perform(get("/api/leaves/employee/{employeeId}", employeeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(leaveId.toString()));

        verify(leaveService, times(1)).findByEmployeeId(employeeId);
    }

    @Test
    @DisplayName("Should find leave requests by employee ID and status successfully")
    void shouldFindLeavesByEmployeeIdAndStatusSuccessfully() throws Exception {
        UUID employeeId = UUID.randomUUID();
        LeaveStatus status = LeaveStatus.PENDENTE;
        when(leaveService.findByEmployeeIdAndStatus(employeeId, status)).thenReturn(Collections.singletonList(leave));

        mockMvc.perform(get("/api/leaves/employee/{employeeId}/status/{status}", employeeId, status.name()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value(status.name()));

        verify(leaveService, times(1)).findByEmployeeIdAndStatus(employeeId, status);
    }

    @Test
    @DisplayName("Should find leave requests by employee ID and type successfully")
    void shouldFindLeavesByEmployeeIdAndTypeSuccessfully() throws Exception {
        UUID employeeId = UUID.randomUUID();
        LeaveType leaveType = LeaveType.FERIAS;
        when(leaveService.findByEmployeeIdAndLeaveType(employeeId, leaveType)).thenReturn(Collections.singletonList(leave));

        mockMvc.perform(get("/api/leaves/employee/{employeeId}/type/{leaveType}", employeeId, leaveType.name()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value(leaveType.name()));

        verify(leaveService, times(1)).findByEmployeeIdAndLeaveType(employeeId, leaveType);
    }

    @Test
    @DisplayName("Should find leave requests by date range successfully")
    void shouldFindLeavesByDateRangeSuccessfully() throws Exception {
        LocalDate startDate = LocalDate.now().minusDays(5);
        LocalDate endDate = LocalDate.now().plusDays(5);
        when(leaveService.findByStartDateBetween(startDate, endDate)).thenReturn(Collections.singletonList(leave));

        mockMvc.perform(get("/api/leaves/date-range")
                .param("startDate", startDate.toString())
                .param("endDate", endDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(leaveId.toString()));

        verify(leaveService, times(1)).findByStartDateBetween(startDate, endDate);
    }
} 