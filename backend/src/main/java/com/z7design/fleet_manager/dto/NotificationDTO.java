package com.z7design.fleet_manager.dto;

import java.time.LocalDateTime;
import java.util.UUID;
import com.z7design.fleet_manager.model.Notification;
import com.z7design.fleet_manager.model.enums.NotificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private UUID id;
    private String title;
    private String message;
    private String type;
    private String category;
    private Boolean isRead;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
    private String actionUrl;
    private String actionText;
    private UUID relatedEntityId;
    private String relatedEntityType;

    public static NotificationDTO fromEntity(Notification notification) {
        if (notification == null) return null;
        
        boolean read = notification.getStatus() == NotificationStatus.READ || notification.getReadAt() != null;
        
        return NotificationDTO.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType() != null ? notification.getType().name() : null)
                .category("INFO")
                .isRead(read)
                .createdAt(notification.getCreatedAt())
                .readAt(notification.getReadAt())
                .actionUrl(null)
                .actionText(null)
                .relatedEntityId(null)
                .relatedEntityType(null)
                .build();
    }
}
