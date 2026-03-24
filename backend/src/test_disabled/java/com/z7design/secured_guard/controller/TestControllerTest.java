package com.z7design.secured_guard.controller;

import com.z7design.secured_guard.model.UserActivityLog;
import com.z7design.secured_guard.model.ErrorLog;
import com.z7design.secured_guard.repository.UserActivityLogRepository;
import com.z7design.secured_guard.repository.ErrorLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@WebMvcTest(LogTestController.class)
public class TestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserActivityLogRepository userActivityLogRepository;

    @MockBean
    private ErrorLogRepository errorLogRepository;

    private UserActivityLog mockActivityLog;
    private ErrorLog mockErrorLog;

    @BeforeEach
    void setUp() {
        // Configurar mock para UserActivityLog
        mockActivityLog = new UserActivityLog();
        mockActivityLog.setId(1L);
        mockActivityLog.setUsername("testuser");
        mockActivityLog.setAction("TEST_ACTION");
        mockActivityLog.setDetails("Test activity details");
        mockActivityLog.setTimestamp(LocalDateTime.now());

        // Configurar mock para ErrorLog
        mockErrorLog = new ErrorLog();
        mockErrorLog.setId(UUID.randomUUID());
        mockErrorLog.setMessage("Test error message");
        mockErrorLog.setEndpoint("/api/test");
        mockErrorLog.setTimestamp(LocalDateTime.now());
        mockErrorLog.setStackTrace("Test stack trace");

        // Configurar comportamento dos repositórios
        when(userActivityLogRepository.save(any(UserActivityLog.class))).thenReturn(mockActivityLog);
        when(errorLogRepository.save(any(ErrorLog.class))).thenReturn(mockErrorLog);
    }

    @Test
    @DisplayName("Should create activity log successfully")
    void shouldCreateActivityLog() throws Exception {
        mockMvc.perform(post("/api/logs/test/activity")
                .param("username", "testuser")
                .param("action", "TEST_ACTION")
                .param("details", "Test activity details"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.action").value("TEST_ACTION"))
                .andExpect(jsonPath("$.details").value("Test activity details"));
    }

    @Test
    @DisplayName("Should create error log successfully")
    void shouldCreateErrorLog() throws Exception {
        mockMvc.perform(post("/api/logs/test/error")
                .param("message", "Test error message")
                .param("endpoint", "/api/test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Test error message"))
                .andExpect(jsonPath("$.endpoint").value("/api/test"));
    }

    @Test
    @DisplayName("Should get activity log by ID")
    void shouldGetActivityLogById() throws Exception {
        when(userActivityLogRepository.findById(1L)).thenReturn(Optional.of(mockActivityLog));

        mockMvc.perform(get("/api/logs/test/activities/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.action").value("TEST_ACTION"));
    }

    @Test
    @DisplayName("Should get error log by ID")
    void shouldGetErrorLogById() throws Exception {
        when(errorLogRepository.findById(mockErrorLog.getId())).thenReturn(Optional.of(mockErrorLog));

        mockMvc.perform(get("/api/logs/test/errors/" + mockErrorLog.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Test error message"))
                .andExpect(jsonPath("$.endpoint").value("/api/test"));
    }
} 