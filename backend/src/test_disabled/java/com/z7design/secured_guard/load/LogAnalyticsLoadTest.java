package com.z7design.secured_guard.load;

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
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class LogAnalyticsLoadTest {

    @Autowired
    private LogAnalyticsService logAnalyticsService;

    @Autowired
    private UserActivityLogRepository userActivityLogRepository;

    @Autowired
    private ErrorLogRepository errorLogRepository;

    private ExecutorService executorService;
    private static final int THREAD_COUNT = 10;
    private static final int OPERATIONS_PER_THREAD = 100;

    @BeforeEach
    void setUp() {
        // Limpar o banco de dados
        userActivityLogRepository.deleteAll();
        errorLogRepository.deleteAll();

        // Criar dados iniciais
        for (int i = 0; i < 1000; i++) {
            UserActivityLog activityLog = new UserActivityLog();
            activityLog.setUsername("user" + (i % 10));
            activityLog.setAction("ACTION_" + (i % 5));
            activityLog.setDetails("Test load " + i);
            activityLog.setTimestamp(LocalDateTime.now());
            userActivityLogRepository.save(activityLog);

            ErrorLog errorLog = new ErrorLog();
            errorLog.setMessage("Error " + i);
            errorLog.setEndpoint("/api/test" + (i % 10));
            errorLog.setStackTrace("Stack trace " + i);
            errorLog.setTimestamp(LocalDateTime.now());
            errorLogRepository.save(errorLog);
        }

        executorService = Executors.newFixedThreadPool(THREAD_COUNT);
    }

    @Test
    void testConcurrentActivityCountByAction() throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(THREAD_COUNT);
        AtomicInteger successCount = new AtomicInteger(0);
        List<Future<?>> futures = new ArrayList<>();

        for (int i = 0; i < THREAD_COUNT; i++) {
            futures.add(executorService.submit(() -> {
                try {
                    for (int j = 0; j < OPERATIONS_PER_THREAD; j++) {
                        logAnalyticsService.getActivityCountByAction();
                        successCount.incrementAndGet();
                    }
                } finally {
                    latch.countDown();
                }
            }));
        }

        latch.await(30, TimeUnit.SECONDS);
        assertEquals(THREAD_COUNT * OPERATIONS_PER_THREAD, successCount.get(), 
            "Todas as operações devem ser concluídas com sucesso");
    }

    @Test
    void testConcurrentErrorCountByEndpoint() throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(THREAD_COUNT);
        AtomicInteger successCount = new AtomicInteger(0);
        List<Future<?>> futures = new ArrayList<>();

        for (int i = 0; i < THREAD_COUNT; i++) {
            futures.add(executorService.submit(() -> {
                try {
                    for (int j = 0; j < OPERATIONS_PER_THREAD; j++) {
                        logAnalyticsService.getErrorCountByEndpoint();
                        successCount.incrementAndGet();
                    }
                } finally {
                    latch.countDown();
                }
            }));
        }

        latch.await(30, TimeUnit.SECONDS);
        assertEquals(THREAD_COUNT * OPERATIONS_PER_THREAD, successCount.get(), 
            "Todas as operações devem ser concluídas com sucesso");
    }

    @Test
    void testConcurrentExportActivitiesToCSV() throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(THREAD_COUNT);
        AtomicInteger successCount = new AtomicInteger(0);
        List<Future<?>> futures = new ArrayList<>();

        for (int i = 0; i < THREAD_COUNT; i++) {
            futures.add(executorService.submit(() -> {
                try {
                    for (int j = 0; j < OPERATIONS_PER_THREAD; j++) {
                        String csv = logAnalyticsService.exportActivitiesToCSV();
                        assertNotNull(csv);
                        assertTrue(csv.contains("ID,Username,Action,Details,Timestamp"));
                        successCount.incrementAndGet();
                    }
                } finally {
                    latch.countDown();
                }
            }));
        }

        latch.await(30, TimeUnit.SECONDS);
        assertEquals(THREAD_COUNT * OPERATIONS_PER_THREAD, successCount.get(), 
            "Todas as operações devem ser concluídas com sucesso");
    }

    @Test
    void testConcurrentActivitiesWithAdvancedFilters() throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(THREAD_COUNT);
        AtomicInteger successCount = new AtomicInteger(0);
        List<Future<?>> futures = new ArrayList<>();

        for (int i = 0; i < THREAD_COUNT; i++) {
            final int threadId = i;
            futures.add(executorService.submit(() -> {
                try {
                    for (int j = 0; j < OPERATIONS_PER_THREAD; j++) {
                        List<UserActivityLog> result = logAnalyticsService.getActivitiesWithAdvancedFilters(
                            "user" + (threadId % 10),
                            "ACTION_" + (j % 5),
                            null, null, null, null, null);
                        assertNotNull(result);
                        successCount.incrementAndGet();
                    }
                } finally {
                    latch.countDown();
                }
            }));
        }

        latch.await(30, TimeUnit.SECONDS);
        assertEquals(THREAD_COUNT * OPERATIONS_PER_THREAD, successCount.get(), 
            "Todas as operações devem ser concluídas com sucesso");
    }
} 