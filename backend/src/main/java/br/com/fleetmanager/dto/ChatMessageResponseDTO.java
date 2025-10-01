package br.com.fleetmanager.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import br.com.fleetmanager.model.enums.ChatMessageType;
import lombok.Data;

@Data
public class ChatMessageResponseDTO {
    
    private UUID id;
    
    private String content;
    
    private UserResponseDTO sender;
    
    private UserResponseDTO recipient;
    
    private UserGroupDTO group;
    
    private DepartmentDTO department;
    
    private ChatMessageType type;
    
    private Boolean isRead;
    
    private LocalDateTime readAt;
    
    private LocalDateTime editedAt;
    
    private UUID replyToId;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
} 