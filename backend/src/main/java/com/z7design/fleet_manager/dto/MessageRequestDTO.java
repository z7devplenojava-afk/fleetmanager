package com.z7design.fleet_manager.dto;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import com.z7design.fleet_manager.model.enums.MessageType;
import com.z7design.fleet_manager.model.enums.MessagePriority;

@Data
public class MessageRequestDTO {
    
    @NotBlank(message = "TÃ­tulo Ã© obrigatÃ³rio")
    private String title;
    
    @NotBlank(message = "ConteÃºdo Ã© obrigatÃ³rio")
    private String content;
    
    @NotNull(message = "Tipo de mensagem Ã© obrigatÃ³rio")
    private MessageType type;
    
    private MessagePriority priority = MessagePriority.NORMAL;
    
    private Set<UUID> recipientIds;
    
    private Set<UUID> groupIds;
    
    private Set<UUID> departmentIds;
    
    private Boolean sendEmail = false;
    
    private Boolean sendNotification = true;
    
    private LocalDateTime scheduledAt;
    
    private UUID replyToId;
} 
