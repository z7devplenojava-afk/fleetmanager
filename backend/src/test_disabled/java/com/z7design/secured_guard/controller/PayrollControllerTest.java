package com.z7design.secured_guard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.secured_guard.model.Employee;
import com.z7design.secured_guard.model.Payroll;
import com.z7design.secured_guard.model.Unit;
import com.z7design.secured_guard.service.PayrollService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PayrollController.class)
public class PayrollControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PayrollService payrollService;

    @Autowired
    private ObjectMapper objectMapper;

    private Payroll payroll;
    private UUID payrollId;
    private UUID employeeId;
    private UUID unitId;
    private Employee employee;
    private Unit unit;

    @BeforeEach
    void setUp() {
        payrollId = UUID.randomUUID();
        employeeId = UUID.randomUUID();
        unitId = UUID.randomUUID();

        employee = new Employee();
        employee.setId(employeeId);

        unit = new Unit();
        unit.setId(unitId);

        payroll = new Payroll();
        payroll.setId(payrollId);
        payroll.setEmployee(employee);
        payroll.setIssueDate(LocalDate.of(2024, 6, 30));
        payroll.setGrossSalary(new BigDecimal("5000.00"));
        payroll.setNetSalary(new BigDecimal("4500.00"));
        payroll.setTotalBenefits(new BigDecimal("200.00"));
        payroll.setTotalDeductions(new BigDecimal("300.00"));
        payroll.setCreatedAt(LocalDateTime.now());
        payroll.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("Should create payroll successfully")
    void shouldCreatePayroll() throws Exception {
        when(payrollService.create(any(Payroll.class))).thenReturn(payroll);

        mockMvc.perform(post("/api/payrolls")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payroll)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(payrollId.toString()))
                .andExpect(jsonPath("$.employee.id").value(employeeId.toString()));
    }

    @Test
    @DisplayName("Should update payroll successfully")
    void shouldUpdatePayroll() throws Exception {
        Payroll updatedPayroll = new Payroll();
        updatedPayroll.setId(payrollId);
        updatedPayroll.setEmployee(employee);
        updatedPayroll.setIssueDate(LocalDate.of(2024, 6, 30));
        updatedPayroll.setGrossSalary(new BigDecimal("5200.00"));
        updatedPayroll.setNetSalary(new BigDecimal("4600.00"));
        updatedPayroll.setTotalBenefits(new BigDecimal("200.00"));
        updatedPayroll.setTotalDeductions(new BigDecimal("300.00"));
        updatedPayroll.setCreatedAt(LocalDateTime.now());
        updatedPayroll.setUpdatedAt(LocalDateTime.now());

        when(payrollService.update(eq(payrollId), any(Payroll.class))).thenReturn(updatedPayroll);

        mockMvc.perform(put("/api/payrolls/{id}", payrollId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedPayroll)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.grossSalary").value(5200.00));
    }

    @Test
    @DisplayName("Should delete payroll successfully")
    void shouldDeletePayroll() throws Exception {
        doNothing().when(payrollService).delete(payrollId);

        mockMvc.perform(delete("/api/payrolls/{id}", payrollId))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("Should get payroll by ID")
    void shouldGetPayrollById() throws Exception {
        when(payrollService.findById(payrollId)).thenReturn(payroll);

        mockMvc.perform(get("/api/payrolls/{id}", payrollId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(payrollId.toString()));
    }

    @Test
    @DisplayName("Should find payrolls by employee ID")
    void shouldFindPayrollsByEmployeeId() throws Exception {
        when(payrollService.findByEmployeeId(employeeId)).thenReturn(Collections.singletonList(payroll));

        mockMvc.perform(get("/api/payrolls/employee/{employeeId}", employeeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].employee.id").value(employeeId.toString()));
    }

    @Test
    @DisplayName("Should find payrolls by unit ID")
    void shouldFindPayrollsByUnitId() throws Exception {
        when(payrollService.findByUnitId(unitId)).thenReturn(Collections.singletonList(payroll));

        mockMvc.perform(get("/api/payrolls/unit/{unitId}", unitId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].unit.id").value(unitId.toString()));
    }

    @Test
    @DisplayName("Should find payrolls by date range")
    void shouldFindPayrollsByDateRange() throws Exception {
        String startDate = "2024-06-01";
        String endDate = "2024-06-30";
        when(payrollService.findByDateBetween(startDate, endDate)).thenReturn(Collections.singletonList(payroll));

        mockMvc.perform(get("/api/payrolls/date-range")
                .param("startDate", startDate)
                .param("endDate", endDate))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].issueDate").value(payroll.getIssueDate().toString()));
    }

    @Test
    @DisplayName("Should find payrolls by month")
    void shouldFindPayrollsByMonth() throws Exception {
        String month = "06";
        when(payrollService.findByMonth(month)).thenReturn(Collections.singletonList(payroll));

        mockMvc.perform(get("/api/payrolls/month/{month}", month))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].issueDate").value(payroll.getIssueDate().toString()));
    }

    @Test
    @DisplayName("Should find payrolls by year")
    void shouldFindPayrollsByYear() throws Exception {
        Integer year = 2024;
        when(payrollService.findByYear(year)).thenReturn(Collections.singletonList(payroll));

        mockMvc.perform(get("/api/payrolls/year/{year}", year))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].issueDate").value(payroll.getIssueDate().toString()));
    }

    @Test
    @DisplayName("Should find all payrolls")
    void shouldFindAllPayrolls() throws Exception {
        when(payrollService.findAll()).thenReturn(Collections.singletonList(payroll));

        mockMvc.perform(get("/api/payrolls"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(payrollId.toString()));
    }
} 