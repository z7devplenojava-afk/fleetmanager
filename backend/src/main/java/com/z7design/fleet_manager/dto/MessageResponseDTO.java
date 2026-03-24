package com.z7design.fleet_manager.dto;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

import lombok.Data;

import com.z7design.fleet_manager.model.enums.MessageType;
import com.z7design.fleet_manager.model.enums.MessagePriority;
import com.z7design.fleet_manager.model.enums.MessageStatus;

@Data
public class MessageResponseDTO {
    
    private UUID id;
    
    private String title;
    
    private String content;
    
    private MessageType type;
    
    private MessagePriority priority;
    
    private MessageStatus status;
    
    private UserResponseDTO sender;
    
    private Set<UserResponseDTO> recipients;
    
    private Set<DepartmentDTO> departments;
    
    private Boolean sendEmail;
    
    private Boolean sendNotification;
    
    private LocalDateTime scheduledAt;
    
    private LocalDateTime sentAt;
    
    private LocalDateTime readAt;
    
    private UUID replyToId;
    
    private MessageResponseDTO replyTo;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
} 
