package com.z7design.fleet_manager.dto;

import java.util.UUID;

import com.z7design.fleet_manager.model.enums.TicketPriority;
import com.z7design.fleet_manager.model.enums.TicketCategory;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTicketRequest {
    
    @NotBlank(message = "TÃ­tulo Ã© obrigatÃ³rio")
    private String title;
    
    @NotBlank(message = "DescriÃ§Ã£o Ã© obrigatÃ³ria")
    private String description;
    
    @NotNull(message = "Prioridade Ã© obrigatÃ³ria")
    private TicketPriority priority;
    
    @NotNull(message = "Categoria Ã© obrigatÃ³ria")
    private TicketCategory category;
    
    private String customerName; // Opcional se customerUserId for fornecido
    
    @Email(message = "Email invÃ¡lido")
    private String customerEmail; // Opcional se customerUserId for fornecido
    
    private String customerPhone;
    
    private UUID customerUserId; // ID do usuÃ¡rio/funcionÃ¡rio (opcional)
    
    private UUID assignedToAgentId;
    
    private UUID companyId;
}


