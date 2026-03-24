package com.z7design.secured_guard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.secured_guard.model.Employee;
import com.z7design.secured_guard.model.Vacation;
import com.z7design.secured_guard.model.User;
import com.z7design.secured_guard.model.enums.VacationStatus;
import com.z7design.secured_guard.service.VacationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(VacationController.class)
public class VacationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private VacationService vacationService;

    @Autowired
    private ObjectMapper objectMapper;

    private Vacation vacation;
    private UUID vacationId;
    private UUID employeeId;
    private UUID approvedById;
    private Employee employee;
    private User approvedBy;

    @BeforeEach
    void setUp() {
        vacationId = UUID.randomUUID();
        employeeId = UUID.randomUUID();
        approvedById = UUID.randomUUID();

        employee = new Employee();
        employee.setId(employeeId);

        approvedBy = new User();
        approvedBy.setId(approvedById);

        vacation = new Vacation();
        vacation.setId(vacationId);
        vacation.setEmployee(employee);
        vacation.setStartDate(LocalDate.of(2024, 8, 1));
        vacation.setEndDate(LocalDate.of(2024, 8, 30));
        vacation.setStatus(VacationStatus.PENDING);
        vacation.setApprovedBy(null);
    }

    @Test
    @DisplayName("Should create a new vacation request")
    void shouldCreateVacation() throws Exception {
        when(vacationService.create(any(Vacation.class))).thenReturn(vacation);

        mockMvc.perform(post("/api/vacations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(vacation)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(vacationId.toString()))
                .andExpect(jsonPath("$.employee.id").value(employeeId.toString()));
    }

    @Test
    @DisplayName("Should update an existing vacation request")
    void shouldUpdateVacation() throws Exception {
        Vacation updatedVacation = new Vacation();
        updatedVacation.setId(vacationId);
        updatedVacation.setEmployee(employee);
        updatedVacation.setStartDate(LocalDate.of(2024, 9, 1));
        updatedVacation.setEndDate(LocalDate.of(2024, 9, 20));
        updatedVacation.setStatus(VacationStatus.PENDING);

        when(vacationService.update(eq(vacationId), any(Vacation.class))).thenReturn(updatedVacation);

        mockMvc.perform(put("/api/vacations/{id}", vacationId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedVacation)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.startDate").value(updatedVacation.getStartDate().toString()));
    }

    @Test
    @DisplayName("Should approve a vacation request")
    void shouldApproveVacation() throws Exception {
        Vacation approvedVacation = new Vacation();
        approvedVacation.setId(vacationId);
        approvedVacation.setEmployee(employee);
        approvedVacation.setStartDate(LocalDate.of(2024, 8, 1));
        approvedVacation.setEndDate(LocalDate.of(2024, 8, 30));
        approvedVacation.setStatus(VacationStatus.APPROVED);
        approvedVacation.setApprovedBy(approvedBy);

        when(vacationService.approve(vacationId, approvedById)).thenReturn(approvedVacation);

        mockMvc.perform(put("/api/vacations/{id}/approve", vacationId)
                .param("approvedBy", approvedById.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(VacationStatus.APPROVED.name()));
    }

    @Test
    @DisplayName("Should reject a vacation request")
    void shouldRejectVacation() throws Exception {
        Vacation rejectedVacation = new Vacation();
        rejectedVacation.setId(vacationId);
        rejectedVacation.setEmployee(employee);
        rejectedVacation.setStartDate(LocalDate.of(2024, 8, 1));
        rejectedVacation.setEndDate(LocalDate.of(2024, 8, 30));
        rejectedVacation.setStatus(VacationStatus.REJECTED);

        when(vacationService.reject(vacationId)).thenReturn(rejectedVacation);

        mockMvc.perform(put("/api/vacations/{id}/reject", vacationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(VacationStatus.REJECTED.name()));
    }

    @Test
    @DisplayName("Should cancel a vacation request")
    void shouldCancelVacation() throws Exception {
        Vacation cancelledVacation = new Vacation();
        cancelledVacation.setId(vacationId);
        cancelledVacation.setEmployee(employee);
        cancelledVacation.setStartDate(LocalDate.of(2024, 8, 1));
        cancelledVacation.setEndDate(LocalDate.of(2024, 8, 30));
        cancelledVacation.setStatus(VacationStatus.CANCELLED);

        when(vacationService.cancel(vacationId)).thenReturn(cancelledVacation);

        mockMvc.perform(put("/api/vacations/{id}/cancel", vacationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(VacationStatus.CANCELLED.name()));
    }

    @Test
    @DisplayName("Should delete a vacation request")
    void shouldDeleteVacation() throws Exception {
        doNothing().when(vacationService).delete(vacationId);

        mockMvc.perform(delete("/api/vacations/{id}", vacationId))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("Should find vacation by ID")
    void shouldFindVacationById() throws Exception {
        when(vacationService.findById(vacationId)).thenReturn(vacation);

        mockMvc.perform(get("/api/vacations/{id}", vacationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(vacationId.toString()));
    }

    @Test
    @DisplayName("Should find vacations by employee ID")
    void shouldFindVacationsByEmployeeId() throws Exception {
        when(vacationService.findByEmployeeId(employeeId)).thenReturn(Collections.singletonList(vacation));

        mockMvc.perform(get("/api/vacations/employee/{employeeId}", employeeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].employee.id").value(employeeId.toString()));
    }

    @Test
    @DisplayName("Should find vacations by employee ID and status")
    void shouldFindVacationsByEmployeeIdAndStatus() throws Exception {
        when(vacationService.findByEmployeeIdAndStatus(employeeId, VacationStatus.PENDING)).thenReturn(Collections.singletonList(vacation));

        mockMvc.perform(get("/api/vacations/employee/{employeeId}/status/{status}", employeeId, VacationStatus.PENDING.name()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value(VacationStatus.PENDING.name()));
    }

    @Test
    @DisplayName("Should find vacations by start date between")
    void shouldFindVacationsByStartDateBetween() throws Exception {
        LocalDate startDate = LocalDate.of(2024, 7, 1);
        LocalDate endDate = LocalDate.of(2024, 8, 31);
        when(vacationService.findByStartDateBetween(startDate, endDate)).thenReturn(Collections.singletonList(vacation));

        mockMvc.perform(get("/api/vacations/date-range")
                .param("startDate", startDate.toString())
                .param("endDate", endDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].startDate").value(vacation.getStartDate().toString()));
    }

    @Test
    @DisplayName("Should find all vacations")
    void shouldFindAllVacations() throws Exception {
        when(vacationService.findAll()).thenReturn(Collections.singletonList(vacation));

        mockMvc.perform(get("/api/vacations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(vacationId.toString()));
    }
} 