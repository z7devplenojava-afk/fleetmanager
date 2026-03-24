package com.z7design.secured_guard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.secured_guard.dto.ErrorResponse;
import com.z7design.secured_guard.model.ErrorLog;
import com.z7design.secured_guard.model.UserActivityLog;
import com.z7design.secured_guard.service.LogAnalyticsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.mockito.MockitoAnnotations;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(LogAnalyticsController.class)
public class LogAnalyticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private LogAnalyticsService logAnalyticsService;

    @Autowired
    private LogAnalyticsController logAnalyticsController;

    @Autowired
    private ObjectMapper objectMapper;

    private UserActivityLog userActivityLog;
    private ErrorLog errorLog;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(logAnalyticsController).build();
        userActivityLog = new UserActivityLog();
        userActivityLog.setId(1L);
        userActivityLog.setUsername("testuser");
        userActivityLog.setAction("LOGIN");
        userActivityLog.setTimestamp(LocalDateTime.now());
        userActivityLog.setDetails("Successful login");

        errorLog = new ErrorLog();
        errorLog.setId(UUID.randomUUID());
        errorLog.setTimestamp(LocalDateTime.now());
        errorLog.setMessage("NullPointerException");
        errorLog.setEndpoint("/api/test");
        errorLog.setStackTrace("Stack trace details");
    }

    @Test
    @DisplayName("Should return activity count by action")
    void shouldReturnActivityCountByAction() throws Exception {
        Map<String, Long> activityCount = new HashMap<>();
        activityCount.put("LOGIN", 10L);
        activityCount.put("LOGOUT", 5L);

        when(logAnalyticsService.getActivityCountByAction()).thenReturn(activityCount);

        mockMvc.perform(get("/api/logs/analytics/activities/by-action"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.LOGIN").value(10L))
                .andExpect(jsonPath("$.LOGOUT").value(5L));

        verify(logAnalyticsService, times(1)).getActivityCountByAction();
    }

    @Test
    @DisplayName("Should return error count by endpoint")
    void shouldReturnErrorCountByEndpoint() throws Exception {
        Map<String, Long> errorCount = new HashMap<>();
        errorCount.put("/api/employees", 3L);
        errorCount.put("/api/documents", 1L);

        when(logAnalyticsService.getErrorCountByEndpoint()).thenReturn(errorCount);

        mockMvc.perform(get("/api/logs/analytics/errors/by-endpoint"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.'/api/employees'").value(3L))
                .andExpect(jsonPath("$.'/api/documents'").value(1L));

        verify(logAnalyticsService, times(1)).getErrorCountByEndpoint();
    }

    @Test
    @DisplayName("Should return activity count by user")
    void shouldReturnActivityCountByUser() throws Exception {
        Map<String, Long> userActivityCount = new HashMap<>();
        userActivityCount.put("user1", 20L);
        userActivityCount.put("user2", 15L);

        when(logAnalyticsService.getActivityCountByUser()).thenReturn(userActivityCount);

        mockMvc.perform(get("/api/logs/analytics/activities/by-user"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user1").value(20L))
                .andExpect(jsonPath("$.user2").value(15L));

        verify(logAnalyticsService, times(1)).getActivityCountByUser();
    }

    @Test
    @DisplayName("Should return advanced activity statistics")
    void shouldReturnAdvancedActivityStats() throws Exception {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalActivities", 100L);
        stats.put("uniqueUsers", 10L);
        stats.put("mostFrequentAction", "VIEW");

        when(logAnalyticsService.getAdvancedActivityStats()).thenReturn(stats);

        mockMvc.perform(get("/api/logs/analytics/activities/stats/advanced"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalActivities").value(100L))
                .andExpect(jsonPath("$.uniqueUsers").value(10L))
                .andExpect(jsonPath("$.mostFrequentAction").value("VIEW"));

        verify(logAnalyticsService, times(1)).getAdvancedActivityStats();
    }

    @Test
    @DisplayName("Should return advanced error statistics")
    void shouldReturnAdvancedErrorStats() throws Exception {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalErrors", 50L);
        stats.put("uniqueEndpoints", 5L);
        stats.put("mostFrequentError", "IOException");

        when(logAnalyticsService.getAdvancedErrorStats()).thenReturn(stats);

        mockMvc.perform(get("/api/logs/analytics/errors/stats/advanced"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalErrors").value(50L))
                .andExpect(jsonPath("$.uniqueEndpoints").value(5L))
                .andExpect(jsonPath("$.mostFrequentError").value("IOException"));

        verify(logAnalyticsService, times(1)).getAdvancedErrorStats();
    }

    @Test
    @DisplayName("Should export activities to CSV")
    void shouldExportActivitiesToCSV() throws Exception {
        String csvContent = "id,username,action\n1,testuser,LOGIN";
        when(logAnalyticsService.exportActivitiesToCSV()).thenReturn(csvContent);

        mockMvc.perform(get("/api/logs/analytics/activities/export/csv"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/plain"))
                .andExpect(header().string("Content-Disposition", "form-data; name=\"attachment\"; filename=\"activities.csv\""))
                .andExpect(content().string(csvContent));

        verify(logAnalyticsService, times(1)).exportActivitiesToCSV();
    }

    @Test
    @DisplayName("Should export activities to JSON")
    void shouldExportActivitiesToJSON() throws Exception {
        String jsonContent = "[{\"id\":1,\"username\":\"testuser\",\"action\":\"LOGIN\"}]";
        when(logAnalyticsService.exportActivitiesToJSON()).thenReturn(jsonContent);

        mockMvc.perform(get("/api/logs/analytics/activities/export/json"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/json"))
                .andExpect(header().string("Content-Disposition", "form-data; name=\"attachment\"; filename=\"activities.json\""))
                .andExpect(content().string(jsonContent));

        verify(logAnalyticsService, times(1)).exportActivitiesToJSON();
    }

    @Test
    @DisplayName("Should export activities to Excel")
    void shouldExportActivitiesToExcel() throws Exception {
        byte[] excelContent = "excel_data".getBytes();
        when(logAnalyticsService.exportActivitiesToExcel()).thenReturn(excelContent);

        mockMvc.perform(get("/api/logs/analytics/activities/export/excel"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .andExpect(header().string("Content-Disposition", "form-data; name=\"attachment\"; filename=\"activities.xlsx\""))
                .andExpect(content().bytes(excelContent));

        verify(logAnalyticsService, times(1)).exportActivitiesToExcel();
    }

    @Test
    @DisplayName("Should export errors to CSV")
    void shouldExportErrorsToCSV() throws Exception {
        String csvContent = "id,level,message\n1,ERROR,NullPointerException";
        when(logAnalyticsService.exportErrorsToCSV()).thenReturn(csvContent);

        mockMvc.perform(get("/api/logs/analytics/errors/export/csv"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/plain"))
                .andExpect(header().string("Content-Disposition", "form-data; name=\"attachment\"; filename=\"errors.csv\""))
                .andExpect(content().string(csvContent));

        verify(logAnalyticsService, times(1)).exportErrorsToCSV();
    }

    @Test
    @DisplayName("Should export errors to JSON")
    void shouldExportErrorsToJSON() throws Exception {
        String jsonContent = "[{\"id\":1,\"level\":\"ERROR\",\"message\":\"NullPointerException\"}]";
        when(logAnalyticsService.exportErrorsToJSON()).thenReturn(jsonContent);

        mockMvc.perform(get("/api/logs/analytics/errors/export/json"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/json"))
                .andExpect(header().string("Content-Disposition", "form-data; name=\"attachment\"; filename=\"errors.json\""))
                .andExpect(content().string(jsonContent));

        verify(logAnalyticsService, times(1)).exportErrorsToJSON();
    }

    @Test
    @DisplayName("Should export errors to Excel")
    void shouldExportErrorsToExcel() throws Exception {
        byte[] excelContent = "excel_error_data".getBytes();
        when(logAnalyticsService.exportErrorsToExcel()).thenReturn(excelContent);

        mockMvc.perform(get("/api/logs/analytics/errors/export/excel"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .andExpect(header().string("Content-Disposition", "form-data; name=\"attachment\"; filename=\"errors.xlsx\""))
                .andExpect(content().bytes(excelContent));

        verify(logAnalyticsService, times(1)).exportErrorsToExcel();
    }

    @Test
    @DisplayName("Should filter activities with advanced options")
    void shouldFilterActivitiesWithAdvancedOptions() throws Exception {
        LocalDateTime startDate = LocalDateTime.now().minusDays(7);
        LocalDateTime endDate = LocalDateTime.now();
        List<UserActivityLog> filteredLogs = Collections.singletonList(userActivityLog);

        when(logAnalyticsService.getActivitiesWithAdvancedFilters(
                eq("testuser"), eq("LOGIN"), any(LocalDateTime.class),
                any(LocalDateTime.class), eq("Successful login"), eq(1L), eq(10L)))
                .thenReturn(filteredLogs);

        mockMvc.perform(get("/api/logs/analytics/activities/filter")
                .param("username", "testuser")
                .param("action", "LOGIN")
                .param("startDate", startDate.toString())
                .param("endDate", endDate.toString())
                .param("details", "Successful login")
                .param("minId", "1")
                .param("maxId", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("testuser"));

        verify(logAnalyticsService, times(1)).getActivitiesWithAdvancedFilters(
                eq("testuser"), eq("LOGIN"), any(LocalDateTime.class),
                any(LocalDateTime.class), eq("Successful login"), eq(1L), eq(10L));
    }

    @Test
    @DisplayName("Should filter errors with advanced options")
    void shouldFilterErrorsWithAdvancedOptions() throws Exception {
        LocalDateTime startDate = LocalDateTime.now().minusDays(7);
        LocalDateTime endDate = LocalDateTime.now();
        List<ErrorLog> filteredErrors = Collections.singletonList(errorLog);

        when(logAnalyticsService.getErrorsWithAdvancedFilters(
                eq("/api/test"), any(LocalDateTime.class), any(LocalDateTime.class), eq("NullPointerException")))
                .thenReturn(filteredErrors);

        mockMvc.perform(get("/api/logs/analytics/errors/filter")
                .param("endpoint", "/api/test")
                .param("startDate", startDate.toString())
                .param("endDate", endDate.toString())
                .param("message", "NullPointerException"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].message").value("NullPointerException"));

        verify(logAnalyticsService, times(1)).getErrorsWithAdvancedFilters(
                eq("/api/test"), any(LocalDateTime.class), any(LocalDateTime.class), eq("NullPointerException"));
    }

    @Test
    void testGetErrorLogs() throws Exception {
        ErrorLog errorLog = new ErrorLog();
        errorLog.setId(UUID.randomUUID());
        errorLog.setMessage("Test Error");
        errorLog.setEndpoint("/test");
        errorLog.setStackTrace("Stack Trace");
        errorLog.setTimestamp(LocalDateTime.now());

        when(logAnalyticsService.getErrorLogs()).thenReturn(Collections.singletonList(errorLog));

        mockMvc.perform(get("/api/logs/analytics/errors/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].message").value("Test Error"));

        verify(logAnalyticsService, times(1)).getErrorLogs();
    }

    @Test
    void testGetErrorLogsByLevel() throws Exception {
        ErrorLog errorLog = new ErrorLog();
        errorLog.setId(UUID.randomUUID());
        errorLog.setMessage("Test Error by Level");
        errorLog.setEndpoint("/test/level");
        errorLog.setStackTrace("Stack Trace by Level");
        errorLog.setTimestamp(LocalDateTime.now());

        when(logAnalyticsService.getErrorLogsByLevel("ERROR")).thenReturn(Collections.singletonList(errorLog));

        mockMvc.perform(get("/api/logs/analytics/errors/level/ERROR"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].message").value("Test Error by Level"));

        verify(logAnalyticsService, times(1)).getErrorLogsByLevel("ERROR");
    }

    @Test
    void testDeleteErrorLog() throws Exception {
        UUID errorLogId = UUID.randomUUID();
        doNothing().when(logAnalyticsService).deleteErrorLog(errorLogId);

        mockMvc.perform(delete("/api/logs/analytics/errors/" + errorLogId))
                .andExpect(status().isNoContent());

        verify(logAnalyticsService, times(1)).deleteErrorLog(errorLogId);
    }
} 