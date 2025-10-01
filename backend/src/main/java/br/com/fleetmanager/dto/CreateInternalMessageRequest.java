package br.com.fleetmanager.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import br.com.fleetmanager.model.enums.MessagePriority;
import br.com.fleetmanager.model.enums.MessageType;

public class CreateInternalMessageRequest {
    
    private String title;
    private String content;
    private List<UUID> recipientIds;
    private List<UUID> departmentIds;
    private MessageType type;
    private MessagePriority priority;
    private Boolean sendEmail;
    private Boolean sendNotification;
    private LocalDateTime scheduledAt;
    
    // Construtores
    public CreateInternalMessageRequest() {}
    
    public CreateInternalMessageRequest(String title, String content, MessageType type) {
        this.title = title;
        this.content = content;
        this.type = type;
        this.priority = MessagePriority.NORMAL;
        this.sendEmail = false;
        this.sendNotification = true;
    }
    
    // Getters e Setters
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
    
    public List<UUID> getRecipientIds() {
        return recipientIds;
    }
    
    public void setRecipientIds(List<UUID> recipientIds) {
        this.recipientIds = recipientIds;
    }
    
    public List<UUID> getDepartmentIds() {
        return departmentIds;
    }
    
    public void setDepartmentIds(List<UUID> departmentIds) {
        this.departmentIds = departmentIds;
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
}