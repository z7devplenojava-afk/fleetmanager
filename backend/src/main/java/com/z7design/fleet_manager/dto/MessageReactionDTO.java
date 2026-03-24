package com.z7design.fleet_manager.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Data;

@Data
public class MessageReactionDTO {
    
    private UUID id;
    
    private UUID messageId;
    
    private UserResponseDTO user;
    
    private String emoji;
    
    private LocalDateTime createdAt;
}


