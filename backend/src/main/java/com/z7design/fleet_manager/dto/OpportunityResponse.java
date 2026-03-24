package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.Opportunity;
import com.z7design.fleet_manager.model.enums.LeadSource;
import com.z7design.fleet_manager.model.enums.LeadStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OpportunityResponse {
    private UUID id;
    private String title;
    private String description;
    private UUID clientId;
    private UUID statusId;
    private String statusName;
    private UUID assignedToId;
    private String assignedToName;
    private BigDecimal estimatedValue;
    private LocalDateTime closeDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private SimpleLead lead;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimpleLead {
        private UUID id;
        private String name;
        private String company;
        private String email;
        private String phone;
        private LeadStatus status;
        private LeadSource source;
        private BigDecimal value;
        private LocalDateTime createdAt;
    }

    public static OpportunityResponse fromEntity(Opportunity opportunity) {
        if (opportunity == null) {
            return null;
        }
        
        try {
            // Acessar lead de forma segura
            SimpleLead lead = null;
            try {
                if (opportunity.getLead() != null) {
                    lead = SimpleLead.builder()
                            .id(opportunity.getLead().getId())
                            .name(opportunity.getLead().getName())
                            .company(opportunity.getLead().getCompany())
                            .email(opportunity.getLead().getEmail())
                            .phone(opportunity.getLead().getPhone())
                            .status(opportunity.getLead().getStatus())
                            .source(opportunity.getLead().getSource())
                            .value(opportunity.getLead().getEstimatedValue())
                            .createdAt(opportunity.getLead().getCreatedAt())
                            .build();
                }
            } catch (Exception e) {
                // Log warning mas continua
                System.err.println("âš ï¸ Erro ao acessar lead da oportunidade " + opportunity.getId() + ": " + e.getMessage());
            }
            
            // Acessar status de forma segura
            String statusName = null;
            try {
                if (opportunity.getStatus() != null) {
                    statusName = opportunity.getStatus().getName();
                }
            } catch (Exception e) {
                System.err.println("âš ï¸ Erro ao acessar status da oportunidade " + opportunity.getId() + ": " + e.getMessage());
            }
            
            // Acessar assignedTo de forma segura
            String assignedToName = null;
            try {
                if (opportunity.getAssignedTo() != null) {
                    assignedToName = opportunity.getAssignedTo().getName();
                }
            } catch (Exception e) {
                System.err.println("âš ï¸ Erro ao acessar assignedTo da oportunidade " + opportunity.getId() + ": " + e.getMessage());
            }
            
            return OpportunityResponse.builder()
                    .id(opportunity.getId())
                    .title(opportunity.getTitle())
                    .description(opportunity.getDescription())
                    .clientId(opportunity.getClient() != null ? opportunity.getClient().getId() : null)
                    .statusId(opportunity.getStatus() != null ? opportunity.getStatus().getId() : null)
                    .statusName(statusName)
                    .assignedToId(opportunity.getAssignedTo() != null ? opportunity.getAssignedTo().getId() : null)
                    .assignedToName(assignedToName)
                    .estimatedValue(opportunity.getEstimatedValue())
                    .closeDate(opportunity.getCloseDate())
                    .lead(lead)
                    .createdAt(opportunity.getCreatedAt())
                    .updatedAt(opportunity.getUpdatedAt())
                    .build();
        } catch (Exception e) {
            System.err.println("âŒ Erro ao converter Opportunity para OpportunityResponse - ID: " + opportunity.getId());
            e.printStackTrace();
            throw new RuntimeException("Erro ao converter Opportunity para OpportunityResponse: " + e.getMessage(), e);
        }
    }
}

