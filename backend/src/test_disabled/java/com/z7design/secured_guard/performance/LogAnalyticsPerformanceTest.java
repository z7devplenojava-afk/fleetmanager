package com.z7design.secured_guard.performance;

import com.z7design.secured_guard.model.UserActivityLog;
import com.z7design.secured_guard.model.ErrorLog;
import com.z7design.secured_guard.repository.UserActivityLogRepository;
import com.z7design.secured_guard.repository.ErrorLogRepository;
import com.z7design.secured_guard.service.LogAnalyticsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class LogAnalyticsPerformanceTest {

    @Autowired
    private LogAnalyticsService logAnalyticsService;

    @Autowired
    private UserActivityLogRepository userActivityLogRepository;

    @Autowired
    private ErrorLogRepository errorLogRepository;

    @BeforeEach
    void setUp() {
        // Limpar o banco de dados
        userActivityLogRepository.deleteAll();
        errorLogRepository.deleteAll();

        // Criar 1000 logs para teste de performance
        for (int i = 0; i < 1000; i++) {
            UserActivityLog activityLog = new UserActivityLog();
            activityLog.setUsername("user" + (i % 10));
            activityLog.setAction("ACTION_" + (i % 5));
            activityLog.setDetails("Test performance " + i);
            activityLog.setTimestamp(LocalDateTime.now());
            userActivityLogRepository.save(activityLog);

            ErrorLog errorLog = new ErrorLog();
            errorLog.setMessage("Error " + i);
            errorLog.setEndpoint("/api/test" + (i % 10));
            errorLog.setStackTrace("Stack trace " + i);
            errorLog.setTimestamp(LocalDateTime.now());
            errorLogRepository.save(errorLog);
        }
    }

    @Test
    void testGetActivityCountByAction_Performance() {
        long startTime = System.nanoTime();
        
        logAnalyticsService.getActivityCountByAction();
        
        long endTime = System.nanoTime();
        long duration = TimeUnit.NANOSECONDS.toMillis(endTime - startTime);
        
        assertTrue(duration < 1000, "Operação deve completar em menos de 1 segundo");
    }

    @Test
    void testGetErrorCountByEndpoint_Performance() {
        long startTime = System.nanoTime();
        
        logAnalyticsService.getErrorCountByEndpoint();
        
        long endTime = System.nanoTime();
        long duration = TimeUnit.NANOSECONDS.toMillis(endTime - startTime);
        
        assertTrue(duration < 1000, "Operação deve completar em menos de 1 segundo");
    }

    @Test
    void testExportActivitiesToCSV_Performance() {
        long startTime = System.nanoTime();
        
        logAnalyticsService.exportActivitiesToCSV();
        
        long endTime = System.nanoTime();
        long duration = TimeUnit.NANOSECONDS.toMillis(endTime - startTime);
        
        assertTrue(duration < 2000, "Exportação deve completar em menos de 2 segundos");
    }

    @Test
    void testGetActivitiesWithAdvancedFilters_Performance() {
        long startTime = System.nanoTime();
        
        List<UserActivityLog> result = logAnalyticsService.getActivitiesWithAdvancedFilters(
            "user1", "ACTION_1", null, null, null, null, null);
        
        long endTime = System.nanoTime();
        long duration = TimeUnit.NANOSECONDS.toMillis(endTime - startTime);
        
        assertTrue(duration < 1000, "Filtragem deve completar em menos de 1 segundo");
        assertFalse(result.isEmpty(), "Deve retornar resultados");
    }
} 