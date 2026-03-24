package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.MessageType;
import com.z7design.fleet_manager.model.enums.MessagePriority;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class InternalMessageDTO {
    
    private UUID id;
    private String title;
    private String content;
    private UUID senderId;
    private String senderName;
    private List<UUID> recipientIds;
    private List<String> recipientNames;
    private List<UUID> departmentIds;
    private List<String> departmentNames;
    private MessageType type;
    private MessagePriority priority;
    private Boolean sendEmail;
    private Boolean sendNotification;
    private LocalDateTime scheduledAt;
    private LocalDateTime sentAt;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer unreadCount;
    private Boolean isRead;
    
    // Construtores
    public InternalMessageDTO() {}
    
    public InternalMessageDTO(UUID id, String title, String content, UUID senderId, String senderName) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.senderId = senderId;
        this.senderName = senderName;
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
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public UUID getSenderId() {
        return senderId;
    }
    
    public void setSenderId(UUID senderId) {
        this.senderId = senderId;
    }
    
    public String getSenderName() {
        return senderName;
    }
    
    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }
    
    public List<UUID> getRecipientIds() {
        return recipientIds;
    }
    
    public void setRecipientIds(List<UUID> recipientIds) {
        this.recipientIds = recipientIds;
    }
    
    public List<String> getRecipientNames() {
        return recipientNames;
    }
    
    public void setRecipientNames(List<String> recipientNames) {
        this.recipientNames = recipientNames;
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
    
    public MessageType getType() {
        return type;
    }
    
    public void setType(MessageType type) {
        this.type = type;
    }
    
    public MessagePriority getPriority() {
        return priority;
    }
    
    public void setPriority(MessagePriority priority) {
        this.priority = priority;
    }
    
    public Boolean getSendEmail() {
        return sendEmail;
    }
    
    public void setSendEmail(Boolean sendEmail) {
        this.sendEmail = sendEmail;
    }
    
    public Boolean getSendNotification() {
        return sendNotification;
    }
    
    public void setSendNotification(Boolean sendNotification) {
        this.sendNotification = sendNotification;
    }
    
    public LocalDateTime getScheduledAt() {
        return scheduledAt;
    }
    
    public void setScheduledAt(LocalDateTime scheduledAt) {
        this.scheduledAt = scheduledAt;
    }
    
    public LocalDateTime getSentAt() {
        return sentAt;
    }
    
    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
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
    
    public Integer getUnreadCount() {
        return unreadCount;
    }
    
    public void setUnreadCount(Integer unreadCount) {
        this.unreadCount = unreadCount;
    }
    
    public Boolean getIsRead() {
        return isRead;
    }
    
    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }
}
