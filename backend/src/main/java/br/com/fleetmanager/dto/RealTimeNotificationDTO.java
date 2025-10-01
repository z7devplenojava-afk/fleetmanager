package br.com.fleetmanager.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import br.com.fleetmanager.model.enums.MessagePriority;
import br.com.fleetmanager.model.enums.NotificationStatus;
import br.com.fleetmanager.model.enums.NotificationType;

public class RealTimeNotificationDTO {
    
    private UUID id;
    private String title;
    private String message;
    private String content;
    private UUID userId;
    private String userName;
    private List<UUID> departmentIds;
    private List<String> departmentNames;
    private NotificationType type;
    private NotificationStatus status;
    private MessagePriority priority;
    private String actionUrl;
    private String actionLabel;
    private Boolean requiresAction;
    private Boolean isRealTime;
    private Boolean sendEmail;
    private Boolean sendPush;
    private Boolean playSound;
    private LocalDateTime expiresAt;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String metadata;
    
    // Construtores
    public RealTimeNotificationDTO() {}
    
    public RealTimeNotificationDTO(UUID id, String title, String message, NotificationType type) {
        this.id = id;
        this.title = title;
        this.message = message;
        this.type = type;
        this.status = NotificationStatus.UNREAD;
        this.priority = MessagePriority.NORMAL;
        this.isRealTime = true;
    }
    
    // Getters e Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public UUID getUserId() {
        return userId;
    }
    
    public void setUserId(UUID userId) {
        this.userId = userId;
    }
    
    public String getUserName() {
        return userName;
    }
    
    public void setUserName(String userName) {
        this.userName = userName;
    }
    
    public List<UUID> getDepartmentIds() {
        return departmentIds;
    }
    
    public void setDepartmentIds(List<UUID> departmentIds) {
        this.departmentIds = departmentIds;
    }
    
    public List<String> getDepartmentNames() {
        return departmentNames;
    }
    
    public void setDepartmentNames(List<String> departmentNames) {
        this.departmentNames = departmentNames;
    }
    
    public NotificationType getType() {
        return type;
    }
    
    public void setType(NotificationType type) {
        this.type = type;
    }
    
    public NotificationStatus getStatus() {
        return status;
    }
    
    public void setStatus(NotificationStatus status) {
        this.status = status;
    }
    
    public MessagePriority getPriority() {
        return priority;
    }
    
    public void setPriority(MessagePriority priority) {
        this.priority = priority;
    }
    
    public String getActionUrl() {
        return actionUrl;
    }
    
    public void setActionUrl(String actionUrl) {
        this.actionUrl = actionUrl;
    }
    
    public String getActionLabel() {
        return actionLabel;
    }
    
    public void setActionLabel(String actionLabel) {
        this.actionLabel = actionLabel;
    }
    
    public Boolean getRequiresAction() {
        return requiresAction;
    }
    
    public void setRequiresAction(Boolean requiresAction) {
        this.requiresAction = requiresAction;
    }
    
    public Boolean getIsRealTime() {
        return isRealTime;
    }
    
    public void setIsRealTime(Boolean isRealTime) {
        this.isRealTime = isRealTime;
    }
    
    public Boolean getSendEmail() {
        return sendEmail;
    }
    
    public void setSendEmail(Boolean sendEmail) {
        this.sendEmail = sendEmail;
    }
    
    public Boolean getSendPush() {
        return sendPush;
    }
    
    public void setSendPush(Boolean sendPush) {
        this.sendPush = sendPush;
    }
    
    public Boolean getPlaySound() {
        return playSound;
    }
    
    public void setPlaySound(Boolean playSound) {
        this.playSound = playSound;
    }
    
    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }
    
    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
    
    public LocalDateTime getReadAt() {
        return readAt;
    }
    
    public void setReadAt(LocalDateTime readAt) {
        this.readAt = readAt;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public String getMetadata() {
        return metadata;
    }
    
    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }
}