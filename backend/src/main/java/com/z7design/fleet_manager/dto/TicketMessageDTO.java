package com.z7design.fleet_manager.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.z7design.fleet_manager.model.TicketMessage;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketMessageDTO {
    private UUID id;
    private UUID ticketId;
    private String content;
    private String senderName;
    private String senderEmail;
    private Boolean isSupport;
    private UUID agentId;
    private LocalDateTime createdAt;
    
    /**
     * Converte a entidade para DTO
     */
    public static TicketMessageDTO fromEntity(TicketMessage message) {
        TicketMessageDTO dto = new TicketMessageDTO();
        dto.setId(message.getId());
        dto.setTicketId(message.getTicket().getId());
        dto.setContent(message.getContent());
        dto.setSenderName(message.getSenderName());
        dto.setSenderEmail(message.getSenderEmail());
        dto.setIsSupport(message.getIsSupport());
        if (message.getAgent() != null) {
            dto.setAgentId(message.getAgent().getId());
        }
        dto.setCreatedAt(message.getCreatedAt());
        return dto;
    }
}


