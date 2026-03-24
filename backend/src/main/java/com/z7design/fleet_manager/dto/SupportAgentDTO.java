package com.z7design.fleet_manager.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.z7design.fleet_manager.model.SupportAgent;
import com.z7design.fleet_manager.model.enums.AgentStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SupportAgentDTO {
    private UUID id;
    private UUID userId;
    private String name;
    private String email;
    private AgentStatus status;
    private String department;
    private LocalDateTime lastActivity;
    private Integer totalTickets;
    private Integer resolvedTickets;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    /**
     * Converte a entidade para DTO
     */
    public static SupportAgentDTO fromEntity(SupportAgent agent) {
        SupportAgentDTO dto = new SupportAgentDTO();
        dto.setId(agent.getId());
        dto.setUserId(agent.getUser().getId());
        dto.setName(agent.getUser().getName());
        dto.setEmail(agent.getUser().getEmail());
        dto.setStatus(agent.getStatus());
        dto.setDepartment(agent.getDepartment());
        dto.setLastActivity(agent.getLastActivity());
        dto.setTotalTickets(agent.getTotalTickets());
        dto.setResolvedTickets(agent.getResolvedTickets());
        dto.setActive(agent.getActive());
        dto.setCreatedAt(agent.getCreatedAt());
        dto.setUpdatedAt(agent.getUpdatedAt());
        return dto;
    }
}


