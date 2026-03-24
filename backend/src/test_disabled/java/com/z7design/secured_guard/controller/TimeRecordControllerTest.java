package com.z7design.secured_guard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.secured_guard.model.Employee;
import com.z7design.secured_guard.model.TimeRecord;
import com.z7design.secured_guard.model.enums.TimeRecordStatus;
import com.z7design.secured_guard.service.TimeRecordService;
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
import java.time.LocalTime;
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

@WebMvcTest(TimeRecordController.class)
public class TimeRecordControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TimeRecordService timeRecordService;

    @Autowired
    private ObjectMapper objectMapper;

    private TimeRecord timeRecord;
    private UUID timeRecordId;
    private UUID employeeId;
    private Employee employee;

    @BeforeEach
    void setUp() {
        timeRecordId = UUID.randomUUID();
        employeeId = UUID.randomUUID();

        employee = new Employee();
        employee.setId(employeeId);

        timeRecord = new TimeRecord();
        timeRecord.setId(timeRecordId);
        timeRecord.setEmployee(employee);
        timeRecord.setRecordDate(LocalDate.of(2024, 7, 1));
        timeRecord.setEntryTime(LocalTime.of(8, 0, 0));
        timeRecord.setExitTime(LocalTime.of(17, 0, 0));
        timeRecord.setEntryLunchTime(LocalTime.of(12, 0, 0));
        timeRecord.setExitLunchTime(LocalTime.of(13, 0, 0));
        timeRecord.setStatus(TimeRecordStatus.PENDING);
        timeRecord.setJustification("None");
    }

    @Test
    @DisplayName("Should create a new time record")
    void shouldCreateTimeRecord() throws Exception {
        when(timeRecordService.create(any(TimeRecord.class))).thenReturn(timeRecord);

        mockMvc.perform(post("/api/time-records")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(timeRecord)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(timeRecordId.toString()))
                .andExpect(jsonPath("$.employee.id").value(employeeId.toString()));
    }

    @Test
    @DisplayName("Should update an existing time record")
    void shouldUpdateTimeRecord() throws Exception {
        TimeRecord updatedTimeRecord = new TimeRecord();
        updatedTimeRecord.setId(timeRecordId);
        updatedTimeRecord.setEmployee(employee);
        updatedTimeRecord.setRecordDate(LocalDate.of(2024, 7, 1));
        updatedTimeRecord.setEntryTime(LocalTime.of(8, 0, 0));
        updatedTimeRecord.setExitTime(LocalTime.of(17, 30, 0));
        updatedTimeRecord.setEntryLunchTime(LocalTime.of(12, 0, 0));
        updatedTimeRecord.setExitLunchTime(LocalTime.of(13, 0, 0));
        updatedTimeRecord.setStatus(TimeRecordStatus.PENDING);
        updatedTimeRecord.setJustification("Reunião estendida.");

        when(timeRecordService.update(eq(timeRecordId), any(TimeRecord.class))).thenReturn(updatedTimeRecord);

        mockMvc.perform(put("/api/time-records/{id}", timeRecordId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedTimeRecord)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.justification").value("Reunião estendida."));
    }

    @Test
    @DisplayName("Should approve a time record")
    void shouldApproveTimeRecord() throws Exception {
        TimeRecord approvedTimeRecord = new TimeRecord();
        approvedTimeRecord.setId(timeRecordId);
        approvedTimeRecord.setEmployee(employee);
        approvedTimeRecord.setRecordDate(LocalDate.of(2024, 7, 1));
        approvedTimeRecord.setEntryTime(LocalTime.of(8, 0, 0));
        approvedTimeRecord.setExitTime(LocalTime.of(17, 0, 0));
        approvedTimeRecord.setStatus(TimeRecordStatus.APPROVED);

        when(timeRecordService.approve(timeRecordId)).thenReturn(approvedTimeRecord);

        mockMvc.perform(post("/api/time-records/{id}/approve", timeRecordId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(TimeRecordStatus.APPROVED.name()));
    }

    @Test
    @DisplayName("Should reject a time record")
    void shouldRejectTimeRecord() throws Exception {
        String justification = "Missing signature.";
        TimeRecord rejectedTimeRecord = new TimeRecord();
        rejectedTimeRecord.setId(timeRecordId);
        rejectedTimeRecord.setEmployee(employee);
        rejectedTimeRecord.setRecordDate(LocalDate.of(2024, 7, 1));
        rejectedTimeRecord.setEntryTime(LocalTime.of(8, 0, 0));
        rejectedTimeRecord.setExitTime(LocalTime.of(17, 0, 0));
        rejectedTimeRecord.setStatus(TimeRecordStatus.REJECTED);
        rejectedTimeRecord.setJustification(justification);

        when(timeRecordService.reject(timeRecordId, justification)).thenReturn(rejectedTimeRecord);

        mockMvc.perform(post("/api/time-records/{id}/reject", timeRecordId)
                .param("justification", justification))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(TimeRecordStatus.REJECTED.name()))
                .andExpect(jsonPath("$.justification").value(justification));
    }

    @Test
    @DisplayName("Should adjust a time record")
    void shouldAdjustTimeRecord() throws Exception {
        LocalTime newEntry = LocalTime.of(8, 15, 0);
        LocalTime newExit = LocalTime.of(17, 45, 0);
        LocalTime newEntryLunch = LocalTime.of(12, 05, 0);
        LocalTime newExitLunch = LocalTime.of(13, 10, 0);
        String justification = "Meeting extended";

        TimeRecord adjustedTimeRecord = new TimeRecord();
        adjustedTimeRecord.setId(timeRecordId);
        adjustedTimeRecord.setEmployee(employee);
        adjustedTimeRecord.setRecordDate(LocalDate.of(2024, 7, 1));
        adjustedTimeRecord.setEntryTime(newEntry);
        adjustedTimeRecord.setExitTime(newExit);
        adjustedTimeRecord.setEntryLunchTime(newEntryLunch);
        adjustedTimeRecord.setExitLunchTime(newExitLunch);
        adjustedTimeRecord.setStatus(TimeRecordStatus.PENDING);
        adjustedTimeRecord.setJustification(justification);

        when(timeRecordService.adjust(eq(timeRecordId), eq(newEntry), eq(newExit), eq(newEntryLunch), eq(newExitLunch), eq(justification)))
                .thenReturn(adjustedTimeRecord);

        mockMvc.perform(post("/api/time-records/{id}/adjust", timeRecordId)
                .param("entryTime", newEntry.toString())
                .param("exitTime", newExit.toString())
                .param("entryLunchTime", newEntryLunch.toString())
                .param("exitLunchTime", newExitLunch.toString())
                .param("justification", justification))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.entryTime").value(newEntry.toString()));
    }

    @Test
    @DisplayName("Should find time record by ID")
    void shouldFindTimeRecordById() throws Exception {
        when(timeRecordService.findById(timeRecordId)).thenReturn(timeRecord);

        mockMvc.perform(get("/api/time-records/{id}", timeRecordId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(timeRecordId.toString()));
    }

    @Test
    @DisplayName("Should find time records by employee ID")
    void shouldFindTimeRecordsByEmployeeId() throws Exception {
        when(timeRecordService.findByEmployeeId(employeeId)).thenReturn(Collections.singletonList(timeRecord));

        mockMvc.perform(get("/api/time-records/employee/{employeeId}", employeeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].employee.id").value(employeeId.toString()));
    }

    @Test
    @DisplayName("Should find time records by employee ID and period")
    void shouldFindTimeRecordsByEmployeeIdAndPeriod() throws Exception {
        LocalDate startDate = LocalDate.of(2024, 7, 1);
        LocalDate endDate = LocalDate.of(2024, 7, 31);
        when(timeRecordService.findByEmployeeIdAndRecordDateBetween(employeeId, startDate, endDate)).thenReturn(Collections.singletonList(timeRecord));

        mockMvc.perform(get("/api/time-records/employee/{employeeId}/period", employeeId)
                .param("startDate", startDate.toString())
                .param("endDate", endDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].recordDate").value(timeRecord.getRecordDate().toString()));
    }

    @Test
    @DisplayName("Should find time records by employee ID and status")
    void shouldFindTimeRecordsByEmployeeIdAndStatus() throws Exception {
        when(timeRecordService.findByEmployeeIdAndStatus(employeeId, TimeRecordStatus.PENDING)).thenReturn(Collections.singletonList(timeRecord));

        mockMvc.perform(get("/api/time-records/employee/{employeeId}/status")
                .param("employeeId", employeeId.toString())
                .param("status", TimeRecordStatus.PENDING.name()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value(TimeRecordStatus.PENDING.name()));
    }
} 