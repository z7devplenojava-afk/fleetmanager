package com.z7design.secured_guard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.secured_guard.dto.ErrorResponse;
import com.z7design.secured_guard.model.Notification;
import com.z7design.secured_guard.model.User;
import com.z7design.secured_guard.model.enums.NotificationStatus;
import com.z7design.secured_guard.model.enums.NotificationType;
import com.z7design.secured_guard.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(NotificationController.class)
public class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NotificationService notificationService;

    @Autowired
    private ObjectMapper objectMapper;

    private Notification notification;
    private UUID notificationId;
    private User user;

    @BeforeEach
    void setUp() {
        notificationId = UUID.randomUUID();
        user = new User();
        user.setId(UUID.randomUUID());

        notification = new Notification();
        notification.setId(notificationId);
        notification.setUser(user);
        notification.setTitle("Test Title");
        notification.setMessage("Test Notification");
        notification.setType(NotificationType.SYSTEM);
        notification.setStatus(NotificationStatus.UNREAD);
        notification.setCreatedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("Should create a new notification successfully")
    void shouldCreateNotificationSuccessfully() throws Exception {
        when(notificationService.create(any(Notification.class))).thenReturn(notification);

        mockMvc.perform(post("/api/notifications")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(notification)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(notification.getId().toString()))
                .andExpect(jsonPath("$.message").value(notification.getMessage()));

        verify(notificationService, times(1)).create(any(Notification.class));
    }

    @Test
    @DisplayName("Should return 400 when creating notification with invalid data")
    void shouldReturnBadRequestWhenCreatingNotificationWithInvalidData() throws Exception {
        Notification invalidNotification = new Notification(); // Missing required fields

        mockMvc.perform(post("/api/notifications")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidNotification)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.timestamp").isNotEmpty());

        verify(notificationService, never()).create(any(Notification.class));
    }

    @Test
    @DisplayName("Should mark a notification as read successfully")
    void shouldMarkAsReadSuccessfully() throws Exception {
        notification.setStatus(NotificationStatus.READ);
        when(notificationService.markAsRead(eq(notificationId))).thenReturn(notification);

        mockMvc.perform(put("/api/notifications/{id}/read", notificationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(NotificationStatus.READ.name()));

        verify(notificationService, times(1)).markAsRead(eq(notificationId));
    }

    @Test
    @DisplayName("Should mark a notification as unread successfully")
    void shouldMarkAsUnreadSuccessfully() throws Exception {
        notification.setStatus(NotificationStatus.UNREAD);
        when(notificationService.markAsUnread(eq(notificationId))).thenReturn(notification);

        mockMvc.perform(put("/api/notifications/{id}/unread", notificationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(NotificationStatus.UNREAD.name()));

        verify(notificationService, times(1)).markAsUnread(eq(notificationId));
    }

    @Test
    @DisplayName("Should delete a notification successfully")
    void shouldDeleteNotificationSuccessfully() throws Exception {
        doNothing().when(notificationService).delete(notificationId);

        mockMvc.perform(delete("/api/notifications/{id}", notificationId))
                .andExpect(status().isNoContent());

        verify(notificationService, times(1)).delete(notificationId);
    }

    @Test
    @DisplayName("Should return 404 when deleting a non-existent notification")
    void shouldReturnNotFoundWhenDeletingNonExistentNotification() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        doThrow(new com.z7design.secured_guard.exception.ResourceNotFoundException("Notification not found"))
                .when(notificationService).delete(nonExistentId);

        mockMvc.perform(delete("/api/notifications/{id}", nonExistentId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Notification not found"));

        verify(notificationService, times(1)).delete(nonExistentId);
    }

    @Test
    @DisplayName("Should find notification by ID successfully")
    void shouldFindNotificationByIdSuccessfully() throws Exception {
        when(notificationService.findById(notificationId)).thenReturn(notification);

        mockMvc.perform(get("/api/notifications/{id}", notificationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(notificationId.toString()))
                .andExpect(jsonPath("$.message").value(notification.getMessage()));

        verify(notificationService, times(1)).findById(notificationId);
    }

    @Test
    @DisplayName("Should return 404 when finding non-existent notification by ID")
    void shouldReturnNotFoundWhenFindingNonExistentNotificationById() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(notificationService.findById(nonExistentId))
                .thenThrow(new com.z7design.secured_guard.exception.ResourceNotFoundException("Notification not found"));

        mockMvc.perform(get("/api/notifications/{id}", nonExistentId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Notification not found"));

        verify(notificationService, times(1)).findById(nonExistentId);
    }

    @Test
    @DisplayName("Should find notifications by user ID successfully")
    void shouldFindNotificationsByUserIdSuccessfully() throws Exception {
        UUID userId = user.getId();
        when(notificationService.findByUserId(userId)).thenReturn(Collections.singletonList(notification));

        mockMvc.perform(get("/api/notifications/user/{userId}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(notificationId.toString()));

        verify(notificationService, times(1)).findByUserId(userId);
    }

    @Test
    @DisplayName("Should find notifications by user ID and status successfully")
    void shouldFindNotificationsByUserIdAndStatusSuccessfully() throws Exception {
        UUID userId = user.getId();
        NotificationStatus status = NotificationStatus.UNREAD;
        when(notificationService.findByUserIdAndStatus(userId, status)).thenReturn(Collections.singletonList(notification));

        mockMvc.perform(get("/api/notifications/user/{userId}/status/{status}", userId, status.name()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value(status.name()));

        verify(notificationService, times(1)).findByUserIdAndStatus(userId, status);
    }

    @Test
    @DisplayName("Should find notifications by user ID and type successfully")
    void shouldFindNotificationsByUserIdAndTypeSuccessfully() throws Exception {
        UUID userId = user.getId();
        NotificationType type = NotificationType.SYSTEM;
        when(notificationService.findByUserIdAndType(userId, type)).thenReturn(Collections.singletonList(notification));

        mockMvc.perform(get("/api/notifications/user/{userId}/type/{type}", userId, type.name()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value(type.name()));

        verify(notificationService, times(1)).findByUserIdAndType(userId, type);
    }

    @Test
    @DisplayName("Should find notifications by creation date range successfully")
    void shouldFindNotificationsByCreationDateRangeSuccessfully() throws Exception {
        LocalDateTime startDate = LocalDateTime.now().minusDays(1);
        LocalDateTime endDate = LocalDateTime.now().plusDays(1);
        when(notificationService.findByCreatedAtBetween(startDate, endDate)).thenReturn(Collections.singletonList(notification));

        mockMvc.perform(get("/api/notifications/date-range")
                .param("startDate", startDate.toString())
                .param("endDate", endDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(notificationId.toString()));

        verify(notificationService, times(1)).findByCreatedAtBetween(startDate, endDate);
    }
} 