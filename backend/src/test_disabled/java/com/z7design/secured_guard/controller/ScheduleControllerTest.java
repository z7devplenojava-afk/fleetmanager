package com.z7design.secured_guard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.secured_guard.model.Employee;
import com.z7design.secured_guard.model.Schedule;
import com.z7design.secured_guard.model.enums.Shift;
import com.z7design.secured_guard.service.ScheduleService;
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

@WebMvcTest(ScheduleController.class)
public class ScheduleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ScheduleService scheduleService;

    @Autowired
    private ObjectMapper objectMapper;

    private Schedule schedule;
    private UUID scheduleId;
    private UUID employeeId;
    private Employee employee;

    @BeforeEach
    void setUp() {
        scheduleId = UUID.randomUUID();
        employeeId = UUID.randomUUID();
        
        employee = new Employee();
        employee.setId(employeeId);

        schedule = new Schedule();
        schedule.setId(scheduleId);
        schedule.setEmployee(employee);
        schedule.setScheduleDate(LocalDate.of(2024, 7, 1));
        schedule.setShift(Shift.MORNING);
        schedule.setObservations("Normal working schedule");
    }

    @Test
    @DisplayName("Should create a new schedule")
    void shouldCreateSchedule() throws Exception {
        when(scheduleService.create(any(Schedule.class))).thenReturn(schedule);

        mockMvc.perform(post("/api/schedules")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(schedule)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(scheduleId.toString()))
                .andExpect(jsonPath("$.employee.id").value(employeeId.toString()));
    }

    @Test
    @DisplayName("Should update an existing schedule")
    void shouldUpdateSchedule() throws Exception {
        Schedule updatedSchedule = new Schedule();
        updatedSchedule.setId(scheduleId);
        updatedSchedule.setEmployee(employee);
        updatedSchedule.setScheduleDate(LocalDate.of(2024, 7, 1));
        updatedSchedule.setShift(Shift.NIGHT);
        updatedSchedule.setObservations("Updated schedule notes");

        when(scheduleService.update(eq(scheduleId), any(Schedule.class))).thenReturn(updatedSchedule);

        mockMvc.perform(put("/api/schedules/{id}", scheduleId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedSchedule)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.observations").value("Updated schedule notes"));
    }

    @Test
    @DisplayName("Should delete a schedule")
    void shouldDeleteSchedule() throws Exception {
        doNothing().when(scheduleService).delete(scheduleId);

        mockMvc.perform(delete("/api/schedules/{id}", scheduleId))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("Should find schedule by ID")
    void shouldFindScheduleById() throws Exception {
        when(scheduleService.findById(scheduleId)).thenReturn(schedule);

        mockMvc.perform(get("/api/schedules/{id}", scheduleId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(scheduleId.toString()));
    }

    @Test
    @DisplayName("Should find schedules by employee ID")
    void shouldFindSchedulesByEmployeeId() throws Exception {
        when(scheduleService.findByEmployeeId(employeeId)).thenReturn(Collections.singletonList(schedule));

        mockMvc.perform(get("/api/schedules/employee/{employeeId}", employeeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].employee.id").value(employeeId.toString()));
    }

    @Test
    @DisplayName("Should find schedules by date")
    void shouldFindSchedulesByDate() throws Exception {
        LocalDate testDate = LocalDate.of(2024, 7, 1);
        when(scheduleService.findByDate(testDate)).thenReturn(Collections.singletonList(schedule));

        mockMvc.perform(get("/api/schedules/date")
                .param("date", testDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].scheduleDate").value(testDate.toString()));
    }

    @Test
    @DisplayName("Should find all schedules")
    void shouldFindAllSchedules() throws Exception {
        when(scheduleService.findAll()).thenReturn(Collections.singletonList(schedule));

        mockMvc.perform(get("/api/schedules"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(scheduleId.toString()));
    }
}