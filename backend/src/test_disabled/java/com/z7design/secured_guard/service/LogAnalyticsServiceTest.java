package com.z7design.secured_guard.service;

import com.z7design.secured_guard.model.UserActivityLog;
import com.z7design.secured_guard.model.ErrorLog;
import com.z7design.secured_guard.repository.UserActivityLogRepository;
import com.z7design.secured_guard.repository.ErrorLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LogAnalyticsServiceTest {

    @Mock
    private UserActivityLogRepository userActivityLogRepository;

    @Mock
    private ErrorLogRepository errorLogRepository;

    @InjectMocks
    private LogAnalyticsService logAnalyticsService;

    private UserActivityLog activityLog1;
    private UserActivityLog activityLog2;
    private ErrorLog errorLog1;
    private ErrorLog errorLog2;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        // Setup test data
        activityLog1 = new UserActivityLog();
        activityLog1.setId(1L);
        activityLog1.setUsername("user1");
        activityLog1.setAction("LOGIN");
        activityLog1.setDetails("User logged in");
        activityLog1.setTimestamp(LocalDateTime.now());

        activityLog2 = new UserActivityLog();
        activityLog2.setId(2L);
        activityLog2.setUsername("user2");
        activityLog2.setAction("LOGOUT");
        activityLog2.setDetails("User logged out");
        activityLog2.setTimestamp(LocalDateTime.now());

        errorLog1 = new ErrorLog();
        errorLog1.setId(UUID.randomUUID());
        errorLog1.setMessage("Error 1");
        errorLog1.setEndpoint("/api/test1");
        errorLog1.setStackTrace("Stack trace 1");
        errorLog1.setTimestamp(LocalDateTime.now());

        errorLog2 = new ErrorLog();
        errorLog2.setId(UUID.randomUUID());
        errorLog2.setMessage("Error 2");
        errorLog2.setEndpoint("/api/test2");
        errorLog2.setStackTrace("Stack trace 2");
        errorLog2.setTimestamp(LocalDateTime.now());
    }

    @Test
    void getActivityCountByAction_ShouldReturnCorrectCounts() {
        when(userActivityLogRepository.findAll()).thenReturn(Arrays.asList(activityLog1, activityLog2));

        Map<String, Long> result = logAnalyticsService.getActivityCountByAction();

        assertEquals(2, result.size());
        assertEquals(1L, result.get("LOGIN"));
        assertEquals(1L, result.get("LOGOUT"));
    }

    @Test
    void getErrorCountByEndpoint_ShouldReturnCorrectCounts() {
        when(errorLogRepository.findAll()).thenReturn(Arrays.asList(errorLog1, errorLog2));

        Map<String, Long> result = logAnalyticsService.getErrorCountByEndpoint();

        assertEquals(2, result.size());
        assertEquals(1L, result.get("/api/test1"));
        assertEquals(1L, result.get("/api/test2"));
    }

    @Test
    void getActivityCountByUser_ShouldReturnCorrectCounts() {
        when(userActivityLogRepository.findAll()).thenReturn(Arrays.asList(activityLog1, activityLog2));

        Map<String, Long> result = logAnalyticsService.getActivityCountByUser();

        assertEquals(2, result.size());
        assertEquals(1L, result.get("user1"));
        assertEquals(1L, result.get("user2"));
    }

    @Test
    void getAdvancedActivityStats_ShouldReturnCorrectStats() {
        when(userActivityLogRepository.findAll()).thenReturn(Arrays.asList(activityLog1, activityLog2));

        Map<String, Object> result = logAnalyticsService.getAdvancedActivityStats();

        assertNotNull(result);
        assertEquals(2L, result.get("totalCount"));
        assertNotNull(result.get("activitiesByHour"));
        assertNotNull(result.get("topActions"));
    }

    @Test
    void getAdvancedErrorStats_ShouldReturnCorrectStats() {
        when(errorLogRepository.findAll()).thenReturn(Arrays.asList(errorLog1, errorLog2));

        Map<String, Object> result = logAnalyticsService.getAdvancedErrorStats();

        assertNotNull(result);
        assertEquals(2L, result.get("totalCount"));
        assertNotNull(result.get("errorsByEndpoint"));
        assertNotNull(result.get("errorsByHour"));
    }

    @Test
    void exportActivitiesToCSV_ShouldReturnCorrectFormat() {
        when(userActivityLogRepository.findAll()).thenReturn(Arrays.asList(activityLog1, activityLog2));

        String result = logAnalyticsService.exportActivitiesToCSV();

        assertTrue(result.startsWith("ID,Username,Action,Details,Timestamp"));
        assertTrue(result.contains("user1"));
        assertTrue(result.contains("user2"));
    }

    @Test
    void exportErrorsToCSV_ShouldReturnCorrectFormat() {
        when(errorLogRepository.findAll()).thenReturn(Arrays.asList(errorLog1, errorLog2));

        String result = logAnalyticsService.exportErrorsToCSV();

        assertTrue(result.startsWith("ID,Message,Endpoint,StackTrace,Timestamp"));
        assertTrue(result.contains("Error 1"));
        assertTrue(result.contains("Error 2"));
    }

    @Test
    void getActivitiesWithAdvancedFilters_ShouldFilterCorrectly() {
        when(userActivityLogRepository.findAll()).thenReturn(Arrays.asList(activityLog1, activityLog2));

        List<UserActivityLog> result = logAnalyticsService.getActivitiesWithAdvancedFilters(
            "user1", "LOGIN", null, null, null, null, null);

        assertEquals(1, result.size());
        assertEquals("user1", result.get(0).getUsername());
        assertEquals("LOGIN", result.get(0).getAction());
    }

    @Test
    void getErrorsWithAdvancedFilters_ShouldFilterCorrectly() {
        when(errorLogRepository.findAll()).thenReturn(Arrays.asList(errorLog1, errorLog2));

        List<ErrorLog> result = logAnalyticsService.getErrorsWithAdvancedFilters(
            "/api/test1", null, null, null);

        assertEquals(1, result.size());
        assertEquals("/api/test1", result.get(0).getEndpoint());
    }
} 