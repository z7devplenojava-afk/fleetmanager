package com.z7design.secured_guard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.secured_guard.dto.ErrorResponse;
import com.z7design.secured_guard.model.Employee;
import com.z7design.secured_guard.model.Overtime;
import com.z7design.secured_guard.model.User;
import com.z7design.secured_guard.model.enums.OvertimeStatus;
import com.z7design.secured_guard.model.enums.OvertimeType;
import com.z7design.secured_guard.service.OvertimeService;
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
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(OvertimeController.class)
public class OvertimeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OvertimeService overtimeService;

    @Autowired
    private ObjectMapper objectMapper;

    private Overtime overtime;
    private UUID overtimeId;
    private UUID employeeId;
    private UUID approvedById;
    private Employee employee;
    private User approvedBy;

    @BeforeEach
    void setUp() {
        overtimeId = UUID.randomUUID();
        employeeId = UUID.randomUUID();
        approvedById = UUID.randomUUID();

        employee = new Employee();
        employee.setId(employeeId);

        approvedBy = new User();
        approvedBy.setId(approvedById);

        overtime = new Overtime();
        overtime.setId(overtimeId);
        overtime.setEmployee(employee);
        overtime.setOvertimeDate(LocalDate.of(2024, 6, 20));
        overtime.setStartTime(LocalTime.of(18, 0));
        overtime.setEndTime(LocalTime.of(20, 30));
        overtime.setTotalHours(2.5);
        overtime.setType(OvertimeType.EXTRA);
        overtime.setReason("Conclusão de projeto urgente");
        overtime.setJustification(null);
        overtime.setStatus(OvertimeStatus.PENDING);
        overtime.setApprovedBy(null);
        overtime.setApprovalDate(null);
    }

    @Test
    @DisplayName("Should create a new overtime request")
    void shouldCreateOvertime() throws Exception {
        when(overtimeService.create(any(Overtime.class))).thenReturn(overtime);

        mockMvc.perform(post("/api/overtimes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(overtime)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(overtimeId.toString()))
                .andExpect(jsonPath("$.employee.id").value(employeeId.toString()));
    }

    @Test
    @DisplayName("Should update an existing overtime request")
    void shouldUpdateOvertime() throws Exception {
        Overtime updatedOvertime = new Overtime();
        updatedOvertime.setId(overtimeId);
        updatedOvertime.setEmployee(employee);
        updatedOvertime.setOvertimeDate(LocalDate.of(2024, 6, 20));
        updatedOvertime.setStartTime(LocalTime.of(18, 0));
        updatedOvertime.setEndTime(LocalTime.of(21, 0));
        updatedOvertime.setTotalHours(3.0);
        updatedOvertime.setType(OvertimeType.EXTRA);
        updatedOvertime.setReason("Conclusão de projeto urgente - atualizado");
        updatedOvertime.setJustification(null);
        updatedOvertime.setStatus(OvertimeStatus.PENDING);
        updatedOvertime.setApprovedBy(null);
        updatedOvertime.setApprovalDate(null);

        when(overtimeService.update(eq(overtimeId), any(Overtime.class))).thenReturn(updatedOvertime);

        mockMvc.perform(put("/api/overtimes/{id}", overtimeId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedOvertime)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalHours").value(3.0));
    }

    @Test
    @DisplayName("Should approve an overtime request")
    void shouldApproveOvertime() throws Exception {
        Overtime approvedOvertime = new Overtime();
        approvedOvertime.setId(overtimeId);
        approvedOvertime.setEmployee(employee);
        approvedOvertime.setOvertimeDate(LocalDate.of(2024, 6, 20));
        approvedOvertime.setStartTime(LocalTime.of(18, 0));
        approvedOvertime.setEndTime(LocalTime.of(20, 30));
        approvedOvertime.setTotalHours(2.5);
        approvedOvertime.setType(OvertimeType.EXTRA);
        approvedOvertime.setReason("Conclusão de projeto urgente");
        approvedOvertime.setJustification(null);
        approvedOvertime.setStatus(OvertimeStatus.APPROVED);
        approvedOvertime.setApprovedBy(approvedBy);
        approvedOvertime.setApprovalDate(LocalDate.now().atStartOfDay());

        when(overtimeService.approve(overtimeId, approvedById)).thenReturn(approvedOvertime);

        mockMvc.perform(post("/api/overtimes/{id}/approve", overtimeId)
                .param("approvedBy", approvedById.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(OvertimeStatus.APPROVED.name()));
    }

    @Test
    @DisplayName("Should reject an overtime request")
    void shouldRejectOvertime() throws Exception {
        String justification = "Motivo de rejeição";
        Overtime rejectedOvertime = new Overtime();
        rejectedOvertime.setId(overtimeId);
        rejectedOvertime.setEmployee(employee);
        rejectedOvertime.setOvertimeDate(LocalDate.of(2024, 6, 20));
        rejectedOvertime.setStartTime(LocalTime.of(18, 0));
        rejectedOvertime.setEndTime(LocalTime.of(20, 30));
        rejectedOvertime.setTotalHours(2.5);
        rejectedOvertime.setType(OvertimeType.EXTRA);
        rejectedOvertime.setReason("Conclusão de projeto urgente");
        rejectedOvertime.setJustification(justification);
        rejectedOvertime.setStatus(OvertimeStatus.REJECTED);
        rejectedOvertime.setApprovedBy(null);
        rejectedOvertime.setApprovalDate(null);

        when(overtimeService.reject(overtimeId, justification)).thenReturn(rejectedOvertime);

        mockMvc.perform(post("/api/overtimes/{id}/reject", overtimeId)
                .param("justification", justification))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(OvertimeStatus.REJECTED.name()))
                .andExpect(jsonPath("$.justification").value(justification));
    }

    @Test
    @DisplayName("Should compensate an overtime request")
    void shouldCompensateOvertime() throws Exception {
        Overtime compensatedOvertime = new Overtime();
        compensatedOvertime.setId(overtimeId);
        compensatedOvertime.setEmployee(employee);
        compensatedOvertime.setOvertimeDate(LocalDate.of(2024, 6, 20));
        compensatedOvertime.setStartTime(LocalTime.of(18, 0));
        compensatedOvertime.setEndTime(LocalTime.of(20, 30));
        compensatedOvertime.setTotalHours(2.5);
        compensatedOvertime.setType(OvertimeType.EXTRA);
        compensatedOvertime.setReason("Conclusão de projeto urgente");
        compensatedOvertime.setJustification(null);
        compensatedOvertime.setStatus(OvertimeStatus.COMPENSATED);
        compensatedOvertime.setApprovedBy(null);
        compensatedOvertime.setApprovalDate(null);

        when(overtimeService.compensate(overtimeId)).thenReturn(compensatedOvertime);

        mockMvc.perform(post("/api/overtimes/{id}/compensate", overtimeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(OvertimeStatus.COMPENSATED.name()));
    }

    @Test
    @DisplayName("Should find overtime by ID")
    void shouldFindOvertimeById() throws Exception {
        when(overtimeService.findById(overtimeId)).thenReturn(overtime);

        mockMvc.perform(get("/api/overtimes/{id}", overtimeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(overtimeId.toString()));
    }

    @Test
    @DisplayName("Should find overtimes by employee ID")
    void shouldFindOvertimesByEmployeeId() throws Exception {
        when(overtimeService.findByEmployeeId(employeeId)).thenReturn(Collections.singletonList(overtime));

        mockMvc.perform(get("/api/overtimes/employee/{employeeId}", employeeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].employee.id").value(employeeId.toString()));
    }

    @Test
    @DisplayName("Should find overtimes by employee ID and status")
    void shouldFindOvertimesByEmployeeIdAndStatus() throws Exception {
        when(overtimeService.findByEmployeeIdAndStatus(employeeId, OvertimeStatus.PENDING)).thenReturn(Collections.singletonList(overtime));

        mockMvc.perform(get("/api/overtimes/employee/{employeeId}/status")
                .param("employeeId", employeeId.toString())
                .param("status", OvertimeStatus.PENDING.name()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value(OvertimeStatus.PENDING.name()));
    }

    @Test
    @DisplayName("Should find overtimes by employee ID and type")
    void shouldFindOvertimesByEmployeeIdAndType() throws Exception {
        when(overtimeService.findByEmployeeIdAndType(employeeId, OvertimeType.EXTRA)).thenReturn(Collections.singletonList(overtime));

        mockMvc.perform(get("/api/overtimes/employee/{employeeId}/type")
                .param("employeeId", employeeId.toString())
                .param("type", OvertimeType.EXTRA.name()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value(OvertimeType.EXTRA.name()));
    }

    @Test
    @DisplayName("Should find overtimes by employee ID and period")
    void shouldFindOvertimesByEmployeeIdAndPeriod() throws Exception {
        LocalDate startDate = LocalDate.of(2024, 6, 1);
        LocalDate endDate = LocalDate.of(2024, 6, 30);
        when(overtimeService.findByEmployeeIdAndOvertimeDateBetween(employeeId, startDate, endDate)).thenReturn(Collections.singletonList(overtime));

        mockMvc.perform(get("/api/overtimes/employee/{employeeId}/period", employeeId)
                .param("startDate", startDate.toString())
                .param("endDate", endDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].overtimeDate").value(overtime.getOvertimeDate().toString()));
    }
}