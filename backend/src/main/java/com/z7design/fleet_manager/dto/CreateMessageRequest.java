package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.MessageType;
import com.z7design.fleet_manager.model.enums.MessagePriority;

import java.util.List;
import java.util.UUID;

public class CreateMessageRequest {
    
    private String title;
    private String content;
    private java.util.UUID recipientId;
    private UUID recipientGroupId;
    private MessageType type;
    private MessagePriority priority;
    
    // Construtores
    public CreateMessageRequest() {}
    
    public CreateMessageRequest(String title, String content, MessageType type) {
        this.title = title;
        this.content = content;
        this.type = type;
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
    
    public java.util.UUID getRecipientId() {
        return recipientId;
    }
    
    public void setRecipientId(java.util.UUID recipientId) {
        this.recipientId = recipientId;
    }
    
    public UUID getRecipientGroupId() {
        return recipientGroupId;
    }
    
    public void setRecipientGroupId(UUID recipientGroupId) {
        this.recipientGroupId = recipientGroupId;
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
} 
