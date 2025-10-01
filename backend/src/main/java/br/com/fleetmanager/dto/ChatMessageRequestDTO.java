package br.com.fleetmanager.dto;

import java.util.UUID;

import br.com.fleetmanager.model.enums.ChatMessageType;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChatMessageRequestDTO {
    
    @NotBlank(message = "Conteúdo da mensagem é obrigatório")
    private String content;
    
    private UUID recipientId;
    
    private UUID groupId;
    
    private UUID departmentId;
    
    private ChatMessageType type = ChatMessageType.TEXT;
    
    private UUID replyToId;
} 