package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.MessageType;
import com.z7design.fleet_manager.model.enums.MessageStatus;
import com.z7design.fleet_manager.model.enums.MessagePriority;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

/**
 * DTO completo para detalhes de mensagens
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDetailDTO {
    
    private UUID id;
    private String title;
    private String content;
    private MessageType type;
    private MessagePriority priority;
    private MessageStatus status;
    private Boolean sendEmail;
    private Boolean sendNotification;
    private LocalDateTime scheduledAt;
    private LocalDateTime sentAt;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Remetente
    private UserResponseDTO sender;
    
    // DestinatÃ¡rios
    private Set<UserResponseDTO> recipients;
    
    // Departamentos
    private Set<DepartmentDTO> departments;
    
    // Grupos de destinatÃ¡rios
    private Set<UserGroupDTO> recipientGroups;
}


