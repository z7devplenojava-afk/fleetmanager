package com.z7design.secured_guard.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;
import java.util.UUID;

import com.z7design.secured_guard.model.enums.NotificationStatus;
import com.z7design.secured_guard.model.enums.NotificationType;

class NotificationTest {

    private Notification notification;
    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername("testuser");

        notification = new Notification();
        notification.setId(UUID.randomUUID());
        notification.setUser(user);
        notification.setType(NotificationType.SCHEDULE);
        notification.setStatus(NotificationStatus.UNREAD);
        notification.setMessage("This is a test notification");
    }

    @Test
    void whenCreateNotification_thenNotificationIsCreated() {
        assertNotNull(notification);
        assertEquals(user, notification.getUser());
        assertEquals(NotificationType.SCHEDULE, notification.getType());
        assertEquals(NotificationStatus.UNREAD, notification.getStatus());
        assertEquals("This is a test notification", notification.getMessage());
        assertNotNull(notification.getCreatedAt());
        assertNotNull(notification.getUpdatedAt());
    }

    @Test
    void whenUpdateStatus_thenStatusIsUpdated() {
        notification.setStatus(NotificationStatus.READ);
        notification.setReadAt(LocalDateTime.now());
        assertEquals(NotificationStatus.READ, notification.getStatus());
        assertNotNull(notification.getReadAt());
    }

    @Test
    void whenUpdateMessage_thenMessageIsUpdated() {
        String newMessage = "Updated notification message";
        notification.setMessage(newMessage);
        assertEquals(newMessage, notification.getMessage());
    }

    @Test
    void whenUpdateType_thenTypeIsUpdated() {
        notification.setType(NotificationType.TIME_RECORD);
        assertEquals(NotificationType.TIME_RECORD, notification.getType());
    }
} 