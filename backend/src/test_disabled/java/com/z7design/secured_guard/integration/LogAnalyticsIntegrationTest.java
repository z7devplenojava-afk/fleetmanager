package com.z7design.secured_guard.integration;

import com.z7design.secured_guard.model.UserActivityLog;
import com.z7design.secured_guard.model.ErrorLog;
import com.z7design.secured_guard.repository.UserActivityLogRepository;
import com.z7design.secured_guard.repository.ErrorLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class LogAnalyticsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserActivityLogRepository userActivityLogRepository;

    @Autowired
    private ErrorLogRepository errorLogRepository;

    @BeforeEach
    void setUp() {
        // Limpar o banco de dados antes de cada teste
        userActivityLogRepository.deleteAll();
        errorLogRepository.deleteAll();

        // Criar dados de teste
        UserActivityLog activityLog = new UserActivityLog();
        activityLog.setUsername("testUser");
        activityLog.setAction("TEST_ACTION");
        activityLog.setDetails("Test integration");
        activityLog.setTimestamp(LocalDateTime.now());
        userActivityLogRepository.save(activityLog);

        ErrorLog errorLog = new ErrorLog();
        errorLog.setMessage("Test error");
        errorLog.setEndpoint("/api/test");
        errorLog.setStackTrace("Test stack trace");
        errorLog.setTimestamp(LocalDateTime.now());
        errorLogRepository.save(errorLog);
    }

    @Test
    void testGetActivityCountByAction() throws Exception {
        mockMvc.perform(get("/api/logs/analytics/activities/by-action"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.TEST_ACTION").value(1));
    }

    @Test
    void testGetErrorCountByEndpoint() throws Exception {
        mockMvc.perform(get("/api/logs/analytics/errors/by-endpoint"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$./api/test").value(1));
    }

    @Test
    void testExportActivitiesToCSV() throws Exception {
        mockMvc.perform(get("/api/logs/analytics/activities/export/csv"))
            .andExpect(status().isOk())
            .andExpect(header().string("Content-Disposition", "attachment; filename=activities.csv"))
            .andExpect(content().string(org.hamcrest.Matchers.containsString("ID,Username,Action,Details,Timestamp")));
    }

    @Test
    void testGetActivitiesWithAdvancedFilters() throws Exception {
        mockMvc.perform(get("/api/logs/analytics/activities/filter/advanced")
                .param("username", "testUser")
                .param("action", "TEST_ACTION"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].username").value("testUser"))
            .andExpect(jsonPath("$[0].action").value("TEST_ACTION"));
    }
} 