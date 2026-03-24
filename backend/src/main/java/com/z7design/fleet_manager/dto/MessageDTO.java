package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.MessageType;
import com.z7design.fleet_manager.model.enums.MessageStatus;
import com.z7design.fleet_manager.model.enums.MessagePriority;
import java.time.LocalDateTime;

public class MessageDTO {
    
    private java.util.UUID id;
    private String title;
    private String content;
    private java.util.UUID senderId;
    private String senderName;
    private java.util.UUID recipientId;
    private String recipientName;
    private java.util.UUID recipientGroupId;
    private String recipientGroupName;
    private MessageType type;
    private MessageStatus status;
    private MessagePriority priority;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
    private LocalDateTime updatedAt;
    
    // Construtores
    public MessageDTO() {}
    
    public MessageDTO(java.util.UUID id, String title, String content, java.util.UUID senderId, String senderName) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.senderId = senderId;
        this.senderName = senderName;
    }
    
    // Getters e Setters
    public java.util.UUID getId() {
        return id;
    }
    
    public void setId(java.util.UUID id) {
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
    
    public java.util.UUID getSenderId() {
        return senderId;
    }
    
    public void setSenderId(java.util.UUID senderId) {
        this.senderId = senderId;
    }
    
    public String getSenderName() {
        return senderName;
    }
    
    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }
    
    public java.util.UUID getRecipientId() {
        return recipientId;
    }
    
    public void setRecipientId(java.util.UUID recipientId) {
        this.recipientId = recipientId;
    }
    
    public String getRecipientName() {
        return recipientName;
    }
    
    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }
    
    public java.util.UUID getRecipientGroupId() {
        return recipientGroupId;
    }
    
    public void setRecipientGroupId(java.util.UUID recipientGroupId) {
        this.recipientGroupId = recipientGroupId;
    }
    
    public String getRecipientGroupName() {
        return recipientGroupName;
    }
    
    public void setRecipientGroupName(String recipientGroupName) {
        this.recipientGroupName = recipientGroupName;
    }
    
    public MessageType getType() {
        return type;
    }
    
    public void setType(MessageType type) {
        this.type = type;
    }
    
    public MessageStatus getStatus() {
        return status;
    }
    
    public void setStatus(MessageStatus status) {
        this.status = status;
    }
    
    public MessagePriority getPriority() {
        return priority;
    }
    
    public void setPriority(MessagePriority priority) {
        this.priority = priority;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getReadAt() {
        return readAt;
    }
    
    public void setReadAt(LocalDateTime readAt) {
        this.readAt = readAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
} 
