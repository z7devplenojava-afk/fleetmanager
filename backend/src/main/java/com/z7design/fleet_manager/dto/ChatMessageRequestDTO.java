package com.z7design.fleet_manager.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import com.z7design.fleet_manager.model.enums.ChatMessageType;

@Data
public class ChatMessageRequestDTO {
    
    // ConteÃºdo Ã© opcional quando hÃ¡ arquivo
    private String content;
    
    private UUID recipientId;
    
    private UUID groupId;
    
    private UUID departmentId;
    
    private ChatMessageType type = ChatMessageType.TEXT;
    
    private UUID replyToId;
    
    // InformaÃ§Ãµes do arquivo (preenchidas apÃ³s upload)
    private String fileUrl;
    private String fileName;
    private Long fileSize;
    private String fileContentType;
} 
