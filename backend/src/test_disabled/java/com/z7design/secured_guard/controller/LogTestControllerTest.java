package com.z7design.secured_guard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.secured_guard.model.ErrorLog;
import com.z7design.secured_guard.model.UserActivityLog;
import com.z7design.secured_guard.repository.ErrorLogRepository;
import com.z7design.secured_guard.repository.UserActivityLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(LogTestController.class)
public class LogTestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserActivityLogRepository userActivityLogRepository;

    @MockBean
    private ErrorLogRepository errorLogRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private UserActivityLog userActivityLog;
    private ErrorLog errorLog;

    @BeforeEach
    void setUp() {
        userActivityLog = new UserActivityLog();
        userActivityLog.setId(1L);
        userActivityLog.setUsername("testuser");
        userActivityLog.setAction("LOGIN");
        userActivityLog.setDetails("User logged in successfully");
        userActivityLog.setTimestamp(LocalDateTime.now());

        errorLog = new ErrorLog();
        errorLog.setId(UUID.randomUUID());
        errorLog.setMessage("NullPointerException");
        errorLog.setEndpoint("/api/test");
        errorLog.setStackTrace("Stack trace details");
        errorLog.setTimestamp(LocalDateTime.now());

    }

    @Test
    @DisplayName("Should create an activity log")
    void shouldCreateActivityLog() throws Exception {
        when(userActivityLogRepository.save(any(UserActivityLog.class))).thenReturn(userActivityLog);

        mockMvc.perform(post("/api/logs/test/activity")
                .param("username", "testuser")
                .param("action", "LOGIN")
                .param("details", "User logged in successfully"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testuser"));
    }

    @Test
    @DisplayName("Should create an error log")
    void shouldCreateErrorLog() throws Exception {
        when(errorLogRepository.save(any(ErrorLog.class))).thenReturn(errorLog);

        mockMvc.perform(post("/api/logs/test/error")
                .param("message", "NullPointerException")
                .param("endpoint", "/api/test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("NullPointerException"));
    }

    @Test
    @DisplayName("Should return paginated activity logs")
    void shouldReturnPaginatedActivityLogs() throws Exception {
        Page<UserActivityLog> page = new PageImpl<>(Collections.singletonList(userActivityLog));
        when(userActivityLogRepository.findAll(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/logs/test/activities/paged")
                .param("page", "0")
                .param("size", "10")
                .param("sortBy", "timestamp")
                .param("direction", "DESC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].username").value("testuser"));
    }

    @Test
    @DisplayName("Should return paginated error logs")
    void shouldReturnPaginatedErrorLogs() throws Exception {
        Page<ErrorLog> page = new PageImpl<>(Collections.singletonList(errorLog));
        when(errorLogRepository.findAll(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/logs/test/errors/paged")
                .param("page", "0")
                .param("size", "10")
                .param("sortBy", "timestamp")
                .param("direction", "DESC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].message").value("NullPointerException"));
    }

    @Test
    @DisplayName("Should filter activity logs")
    void shouldFilterActivityLogs() throws Exception {
        when(userActivityLogRepository.findAll()).thenReturn(Collections.singletonList(userActivityLog));

        mockMvc.perform(get("/api/logs/test/activities/filter")
                .param("username", "testuser")
                .param("action", "LOGIN")
                .param("startDate", LocalDateTime.now().minusHours(1).toString())
                .param("endDate", LocalDateTime.now().plusHours(1).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("testuser"));
    }

    @Test
    @DisplayName("Should filter error logs")
    void shouldFilterErrorLogs() throws Exception {
        when(errorLogRepository.findAll()).thenReturn(Collections.singletonList(errorLog));

        mockMvc.perform(get("/api/logs/test/errors/filter")
                .param("endpoint", "/api/test")
                .param("startDate", LocalDateTime.now().minusHours(1).toString())
                .param("endDate", LocalDateTime.now().plusHours(1).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].endpoint").value("/api/test"));
    }

    @Test
    @DisplayName("Should return activity stats")
    void shouldReturnActivityStats() throws Exception {
        when(userActivityLogRepository.count()).thenReturn(1L);
        when(userActivityLogRepository.findAll()).thenReturn(Collections.singletonList(userActivityLog));

        mockMvc.perform(get("/api/logs/test/activities/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCount").value(1L))
                .andExpect(jsonPath("$.recentLogs[0].username").value("testuser"));
    }

    @Test
    @DisplayName("Should return error stats")
    void shouldReturnErrorStats() throws Exception {
        when(errorLogRepository.count()).thenReturn(1L);
        when(errorLogRepository.findAll()).thenReturn(Collections.singletonList(errorLog));

        mockMvc.perform(get("/api/logs/test/errors/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCount").value(1L))
                .andExpect(jsonPath("$.recentErrors[0].message").value("NullPointerException"));
    }

    @Test
    @DisplayName("Should get activity log by ID")
    void shouldGetActivityLogById() throws Exception {
        when(userActivityLogRepository.findById(any(Long.class))).thenReturn(Optional.of(userActivityLog));

        mockMvc.perform(get("/api/logs/test/activities/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    @DisplayName("Should get error log by ID")
    void shouldGetErrorLogById() throws Exception {
        when(errorLogRepository.findById(any(UUID.class))).thenReturn(Optional.of(errorLog));

        mockMvc.perform(get("/api/logs/test/errors/{id}", errorLog.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(errorLog.getId().toString()));
    }

    @Test
    @DisplayName("Should get activity count")
    void shouldGetActivityCount() throws Exception {
        when(userActivityLogRepository.count()).thenReturn(10L);

        mockMvc.perform(get("/api/logs/test/activities/count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(10L));
    }

    @Test
    @DisplayName("Should get error count")
    void shouldGetErrorCount() throws Exception {
        when(errorLogRepository.count()).thenReturn(5L);

        mockMvc.perform(get("/api/logs/test/errors/count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(5L));
    }
} 