package com.z7design.secured_guard.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;
import java.util.UUID;

class ErrorLogTest {

    private ErrorLog errorLog;

    @BeforeEach
    void setUp() {
        errorLog = new ErrorLog();
        errorLog.setId(UUID.randomUUID());
        errorLog.setMessage("Test error message");
        errorLog.setEndpoint("/api/test");
        errorLog.setStackTrace("Test stack trace");
    }

    @Test
    void whenCreateErrorLog_thenErrorLogIsCreated() {
        assertNotNull(errorLog);
        assertEquals("Test error message", errorLog.getMessage());
        assertEquals("/api/test", errorLog.getEndpoint());
        assertEquals("Test stack trace", errorLog.getStackTrace());
        assertNotNull(errorLog.getTimestamp());
    }

    @Test
    void whenUpdateMessage_thenMessageIsUpdated() {
        String newMessage = "Updated error message";
        errorLog.setMessage(newMessage);
        assertEquals(newMessage, errorLog.getMessage());
    }

    @Test
    void whenUpdateEndpoint_thenEndpointIsUpdated() {
        String newEndpoint = "/api/new";
        errorLog.setEndpoint(newEndpoint);
        assertEquals(newEndpoint, errorLog.getEndpoint());
    }

    @Test
    void whenUpdateStackTrace_thenStackTraceIsUpdated() {
        String newStackTrace = "Updated stack trace";
        errorLog.setStackTrace(newStackTrace);
        assertEquals(newStackTrace, errorLog.getStackTrace());
    }
} 