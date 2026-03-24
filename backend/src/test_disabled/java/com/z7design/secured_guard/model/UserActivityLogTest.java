package com.z7design.secured_guard.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;
import java.util.UUID;

class UserActivityLogTest {

    private UserActivityLog activityLog;

    @BeforeEach
    void setUp() {
        activityLog = new UserActivityLog();
        activityLog.setId(1L);
        activityLog.setUsername("testuser");
        activityLog.setAction("LOGIN");
        activityLog.setDetails("User logged in successfully");
    }

    @Test
    void whenCreateActivityLog_thenActivityLogIsCreated() {
        assertNotNull(activityLog);
        assertEquals("testuser", activityLog.getUsername());
        assertEquals("LOGIN", activityLog.getAction());
        assertEquals("User logged in successfully", activityLog.getDetails());
        assertNotNull(activityLog.getTimestamp());
    }

    @Test
    void whenUpdateAction_thenActionIsUpdated() {
        String newAction = "LOGOUT";
        activityLog.setAction(newAction);
        assertEquals(newAction, activityLog.getAction());
    }

    @Test
    void whenUpdateDetails_thenDetailsAreUpdated() {
        String newDetails = "User logged out successfully";
        activityLog.setDetails(newDetails);
        assertEquals(newDetails, activityLog.getDetails());
    }

    @Test
    void whenUpdateUsername_thenUsernameIsUpdated() {
        String newUsername = "newuser";
        activityLog.setUsername(newUsername);
        assertEquals(newUsername, activityLog.getUsername());
    }
} 