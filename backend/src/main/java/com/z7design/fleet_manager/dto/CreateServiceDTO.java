package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateServiceDTO {
    
    @NotBlank(message = "Nome do serviÃ§o Ã© obrigatÃ³rio")
    @Size(max = 255, message = "Nome deve ter no mÃ¡ximo 255 caracteres")
    private String name;
    
    @Size(max = 1000, message = "DescriÃ§Ã£o deve ter no mÃ¡ximo 1000 caracteres")
    private String description;
    
    @Size(max = 100, message = "Categoria deve ter no mÃ¡ximo 100 caracteres")
    private String category;
    
    @Size(max = 50, message = "CÃ³digo deve ter no mÃ¡ximo 50 caracteres")
    private String code;
    
    private BigDecimal unitPrice;
    
    @Size(max = 20, message = "Unidade deve ter no mÃ¡ximo 20 caracteres")
    private String unit;
    
    private Boolean isBillable;
    
    private Boolean requiresEquipment;
    
    private Boolean requiresCertification;
    
    private Integer estimatedDurationHours;
    
    private Integer minEmployeesRequired;
    
    private Integer maxEmployeesAllowed;
    
    @Size(max = 500, message = "ObservaÃ§Ãµes devem ter no mÃ¡ximo 500 caracteres")
    private String notes;
    
    private UUID createdBy;
}

