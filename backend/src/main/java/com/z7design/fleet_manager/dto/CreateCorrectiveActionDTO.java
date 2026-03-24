package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO para criaÃ§Ã£o de aÃ§Ãµes corretivas
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCorrectiveActionDTO {
    
    @NotBlank(message = "TÃ­tulo Ã© obrigatÃ³rio")
    private String title;
    
    @NotBlank(message = "DescriÃ§Ã£o Ã© obrigatÃ³ria")
    private String description;
    
    @NotNull(message = "Origem Ã© obrigatÃ³ria")
    private String origin; // INSPECAO, ACIDENTE, AUDITORIA, NAO_CONFORMIDADE, OUTROS
    
    @NotNull(message = "Prioridade Ã© obrigatÃ³ria")
    private String priority; // BAIXA, MEDIA, ALTA, CRITICA
    
    private String status; // PENDENTE, EM_ANDAMENTO, CONCLUIDA, CANCELADA
    
    private UUID responsibleUserId;
    
    private String responsibleName; // Nome do responsÃ¡vel (alternativa ao userId)
    
    @NotNull(message = "Data de vencimento Ã© obrigatÃ³ria")
    private LocalDate dueDate;
    
    private String department;
    
    private String notes;
    
    private UUID relatedInspectionId;
    
    private UUID relatedAccidentId;
    
    private UUID relatedNonConformityId;
}





