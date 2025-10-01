package br.com.fleetmanager.dto;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

import br.com.fleetmanager.model.enums.MessagePriority;
import br.com.fleetmanager.model.enums.MessageType;
import lombok.Data;

@Data
public class MessageResponseDTO {
    
    private UUID id;
    
    private String title;
    
    private String content;
    
    private MessageType type;
    
    private MessagePriority priority;
    
    private UserResponseDTO sender;
    
    private Set<UserResponseDTO> recipients;
    
    private Set<DepartmentDTO> departments;
    
    private Boolean sendEmail;
    
    private Boolean sendNotification;
    
    private LocalDateTime scheduledAt;
    
    private LocalDateTime sentAt;
    
    private LocalDateTime readAt;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
} 