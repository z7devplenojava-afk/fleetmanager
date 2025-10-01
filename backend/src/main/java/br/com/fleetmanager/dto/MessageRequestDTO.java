package br.com.fleetmanager.dto;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

import br.com.fleetmanager.model.enums.MessagePriority;
import br.com.fleetmanager.model.enums.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MessageRequestDTO {
    
    @NotBlank(message = "Título é obrigatório")
    private String title;
    
    @NotBlank(message = "Conteúdo é obrigatório")
    private String content;
    
    @NotNull(message = "Tipo de mensagem é obrigatório")
    private MessageType type;
    
    private MessagePriority priority = MessagePriority.NORMAL;
    
    private Set<UUID> recipientIds;
    
    private Set<UUID> groupIds;
    
    private Set<UUID> departmentIds;
    
    private Boolean sendEmail = false;
    
    private Boolean sendNotification = true;
    
    private LocalDateTime scheduledAt;
} 