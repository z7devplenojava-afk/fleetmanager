package com.z7design.secured_guard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.secured_guard.model.Employee;
import com.z7design.secured_guard.model.ScaleHistory;
import com.z7design.secured_guard.model.Schedule;
import com.z7design.secured_guard.model.enums.ScheduleStatus;
import com.z7design.secured_guard.model.enums.Shift;
import com.z7design.secured_guard.repository.ScaleHistoryRepository;
import com.z7design.secured_guard.service.ScaleHistoryService;
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
import java.time.LocalDateTime;
import java.util.Arrays;
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

@WebMvcTest(ScaleHistoryController.class)
public class ScaleHistoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ScaleHistoryRepository scaleHistoryRepository;

    @MockBean
    private ScaleHistoryService scaleHistoryService;

    @Autowired
    private ObjectMapper objectMapper;

    private ScaleHistory scaleHistory;
    private UUID scaleHistoryId;
    private UUID employeeId;
    private UUID scheduleId;
    private Employee employee;
    private Schedule schedule;

    @BeforeEach
    void setUp() {
        employee = new Employee();
        employee.setId(UUID.randomUUID());
        employee.setName("Test Employee");

        scaleHistory = new ScaleHistory();
        scaleHistory.setId(UUID.randomUUID());
        scaleHistory.setEmployee(employee);
        scaleHistory.setDate(LocalDate.now());
        scaleHistory.setShift(Shift.FULL_TIME);
        scaleHistory.setStatus(ScheduleStatus.PENDING);
        scaleHistory.setNotes("Test notes");
        scaleHistory.setCreatedAt(LocalDateTime.now());
        scaleHistory.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("Should create scale history successfully")
    void shouldCreateScaleHistory() throws Exception {
        when(scaleHistoryService.create(any(ScaleHistory.class))).thenReturn(scaleHistory);

        mockMvc.perform(post("/api/scale-histories")
                .contentType("application/json")
                .content("{\"employee\":{\"id\":\"" + employee.getId() + "\"}," +
                        "\"date\":\"" + LocalDate.now() + "\"," +
                        "\"shift\":\"FULL_TIME\"," +
                        "\"status\":\"PENDING\"," +
                        "\"notes\":\"Test notes\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.employee.id").value(employee.getId().toString()))
                .andExpect(jsonPath("$.shift").value("FULL_TIME"))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.notes").value("Test notes"));
    }

    @Test
    @DisplayName("Should get scale history by ID")
    void shouldGetScaleHistoryById() throws Exception {
        when(scaleHistoryService.findById(scaleHistory.getId())).thenReturn(scaleHistory);

        mockMvc.perform(get("/api/scale-histories/" + scaleHistory.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(scaleHistory.getId().toString()))
                .andExpect(jsonPath("$.employee.id").value(employee.getId().toString()))
                .andExpect(jsonPath("$.shift").value("FULL_TIME"))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.notes").value("Test notes"));
    }

    @Test
    @DisplayName("Should update scale history successfully")
    void shouldUpdateScaleHistory() throws Exception {
        ScaleHistory updatedScaleHistory = new ScaleHistory();
        updatedScaleHistory.setId(scaleHistory.getId());
        updatedScaleHistory.setEmployee(employee);
        updatedScaleHistory.setDate(LocalDate.now());
        updatedScaleHistory.setShift(Shift.AFTERNOON);
        updatedScaleHistory.setStatus(ScheduleStatus.APPROVED);
        updatedScaleHistory.setNotes("Updated notes");
        updatedScaleHistory.setCreatedAt(LocalDateTime.now());
        updatedScaleHistory.setUpdatedAt(LocalDateTime.now());

        when(scaleHistoryService.findById(scaleHistory.getId())).thenReturn(scaleHistory);
        when(scaleHistoryService.update(any(UUID.class), any(ScaleHistory.class))).thenReturn(updatedScaleHistory);

        mockMvc.perform(put("/api/scale-histories/" + scaleHistory.getId())
                .contentType("application/json")
                .content("{\"employee\":{\"id\":\"" + employee.getId() + "\"}," +
                        "\"date\":\"" + LocalDate.now() + "\"," +
                        "\"shift\":\"AFTERNOON\"," +
                        "\"status\":\"APPROVED\"," +
                        "\"notes\":\"Updated notes\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(scaleHistory.getId().toString()))
                .andExpect(jsonPath("$.shift").value("AFTERNOON"))
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.notes").value("Updated notes"));
    }

    @Test
    @DisplayName("Should delete scale history successfully")
    void shouldDeleteScaleHistory() throws Exception {
        when(scaleHistoryService.findById(scaleHistory.getId())).thenReturn(scaleHistory);

        mockMvc.perform(delete("/api/scale-histories/" + scaleHistory.getId()))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("Should find scale histories by employee ID")
    void shouldFindScaleHistoriesByEmployeeId() throws Exception {
        List<ScaleHistory> scaleHistories = Arrays.asList(scaleHistory);
        when(scaleHistoryService.findByEmployeeId(employee.getId())).thenReturn(scaleHistories);

        mockMvc.perform(get("/api/scale-histories/employee/" + employee.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(scaleHistory.getId().toString()))
                .andExpect(jsonPath("$[0].employee.id").value(employee.getId().toString()))
                .andExpect(jsonPath("$[0].shift").value("FULL_TIME"))
                .andExpect(jsonPath("$[0].status").value("PENDING"))
                .andExpect(jsonPath("$[0].notes").value("Test notes"));
    }

    @Test
    @DisplayName("Should find scale histories by date range")
    void shouldFindScaleHistoriesByDateRange() throws Exception {
        List<ScaleHistory> scaleHistories = Arrays.asList(scaleHistory);
        LocalDate startDate = LocalDate.now().minusDays(7);
        LocalDate endDate = LocalDate.now();

        when(scaleHistoryService.findByDateRange(startDate, endDate)).thenReturn(scaleHistories);

        mockMvc.perform(get("/api/scale-histories/date-range")
                .param("startDate", startDate.toString())
                .param("endDate", endDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(scaleHistory.getId().toString()))
                .andExpect(jsonPath("$[0].employee.id").value(employee.getId().toString()))
                .andExpect(jsonPath("$[0].shift").value("FULL_TIME"))
                .andExpect(jsonPath("$[0].status").value("PENDING"))
                .andExpect(jsonPath("$[0].notes").value("Test notes"));
    }

    @Test
    @DisplayName("Should find scale histories by employee ID and date range")
    void shouldFindScaleHistoriesByEmployeeIdAndDateRange() throws Exception {
        List<ScaleHistory> scaleHistories = Arrays.asList(scaleHistory);
        LocalDate startDate = LocalDate.now().minusDays(7);
        LocalDate endDate = LocalDate.now();

        when(scaleHistoryService.findByEmployeeIdAndDateRange(employee.getId(), startDate, endDate)).thenReturn(scaleHistories);

        mockMvc.perform(get("/api/scale-histories/employee/" + employee.getId() + "/date-range")
                .param("startDate", startDate.toString())
                .param("endDate", endDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(scaleHistory.getId().toString()))
                .andExpect(jsonPath("$[0].employee.id").value(employee.getId().toString()))
                .andExpect(jsonPath("$[0].shift").value("FULL_TIME"))
                .andExpect(jsonPath("$[0].status").value("PENDING"))
                .andExpect(jsonPath("$[0].notes").value("Test notes"));
    }

    @Test
    @DisplayName("Should find all scale histories")
    void shouldFindAllScaleHistories() throws Exception {
        List<ScaleHistory> scaleHistories = Arrays.asList(scaleHistory);
        when(scaleHistoryService.findAll()).thenReturn(scaleHistories);

        mockMvc.perform(get("/api/scale-histories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(scaleHistory.getId().toString()))
                .andExpect(jsonPath("$[0].employee.id").value(employee.getId().toString()))
                .andExpect(jsonPath("$[0].shift").value("FULL_TIME"))
                .andExpect(jsonPath("$[0].status").value("PENDING"))
                .andExpect(jsonPath("$[0].notes").value("Test notes"));
    }
} 