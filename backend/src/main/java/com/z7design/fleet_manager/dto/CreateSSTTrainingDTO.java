package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para criaÃ§Ã£o de treinamentos SST
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSSTTrainingDTO {
    
    @NotBlank(message = "Nome do treinamento Ã© obrigatÃ³rio")
    @Size(max = 100, message = "Nome deve ter no mÃ¡ximo 100 caracteres")
    private String name;
    
    private String description;
    
    @NotBlank(message = "Tipo de treinamento Ã© obrigatÃ³rio")
    @Size(max = 50, message = "Tipo deve ter no mÃ¡ximo 50 caracteres")
    private String trainingType; // NR_35, CIPA, NR_10, BRIGADA_INCENDIO, etc.
    
    @NotNull(message = "DuraÃ§Ã£o Ã© obrigatÃ³ria")
    private Integer durationHours;
    
    private Integer validityMonths; // Validade em meses (null = sem validade)
    
    private Boolean isMandatory;
    
    @Size(max = 100, message = "Fornecedor deve ter no mÃ¡ximo 100 caracteres")
    private String provider;
    
    private Boolean isActive;
    
    private String[] requiredForRisks; // Array de IDs de riscos que exigem este treinamento
}


