package com.z7design.fleet_manager.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateAgentRequest {
    
    @NotNull(message = "ID do usuÃ¡rio Ã© obrigatÃ³rio")
    private UUID userId;
    
    private String department;
    
    private Boolean active = true;
}


