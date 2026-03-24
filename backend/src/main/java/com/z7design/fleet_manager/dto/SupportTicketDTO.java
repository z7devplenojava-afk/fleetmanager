package com.z7design.fleet_manager.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.z7design.fleet_manager.model.SupportTicket;
import com.z7design.fleet_manager.model.enums.TicketStatus;
import com.z7design.fleet_manager.model.enums.TicketPriority;
import com.z7design.fleet_manager.model.enums.TicketCategory;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SupportTicketDTO {
    private UUID id;
    private String title;
    private String description;
    private TicketPriority priority;
    private TicketStatus status;
    private TicketCategory category;
    private SupportAgentDTO assignedTo;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private UUID companyId;
    private List<TicketMessageDTO> messages = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;
    
    /**
     * Converte a entidade para DTO
     */
    public static SupportTicketDTO fromEntity(SupportTicket ticket) {
        return fromEntity(ticket, false);
    }
    
    /**
     * Converte a entidade para DTO com opÃ§Ã£o de incluir mensagens
     */
    public static SupportTicketDTO fromEntity(SupportTicket ticket, boolean includeMessages) {
        SupportTicketDTO dto = new SupportTicketDTO();
        dto.setId(ticket.getId());
        dto.setTitle(ticket.getTitle());
        dto.setDescription(ticket.getDescription());
        dto.setPriority(ticket.getPriority());
        dto.setStatus(ticket.getStatus());
        dto.setCategory(ticket.getCategory());
        
        if (ticket.getAssignedTo() != null) {
            dto.setAssignedTo(SupportAgentDTO.fromEntity(ticket.getAssignedTo()));
        }
        
        dto.setCustomerName(ticket.getCustomerName());
        dto.setCustomerEmail(ticket.getCustomerEmail());
        dto.setCustomerPhone(ticket.getCustomerPhone());
        
        if (ticket.getCompany() != null) {
            dto.setCompanyId(ticket.getCompany().getId());
        }
        
        if (includeMessages && ticket.getMessages() != null) {
            dto.setMessages(
                ticket.getMessages().stream()
                    .map(TicketMessageDTO::fromEntity)
                    .collect(Collectors.toList())
            );
        }
        
        dto.setCreatedAt(ticket.getCreatedAt());
        dto.setUpdatedAt(ticket.getUpdatedAt());
        dto.setResolvedAt(ticket.getResolvedAt());
        dto.setClosedAt(ticket.getClosedAt());
        
        return dto;
    }
}


