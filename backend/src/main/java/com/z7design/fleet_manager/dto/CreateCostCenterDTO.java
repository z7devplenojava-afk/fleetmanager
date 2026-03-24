package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.CostCenter;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class CreateCostCenterDTO {
    
    @NotBlank(message = "CÃ³digo Ã© obrigatÃ³rio")
    @Size(max = 20, message = "CÃ³digo deve ter no mÃ¡ximo 20 caracteres")
    private String code;
    
    @NotBlank(message = "Nome Ã© obrigatÃ³rio")
    @Size(max = 255, message = "Nome deve ter no mÃ¡ximo 255 caracteres")
    private String name;
    
    @Size(max = 1000, message = "DescriÃ§Ã£o deve ter no mÃ¡ximo 1000 caracteres")
    private String description;
    
    @Size(max = 255, message = "ResponsÃ¡vel deve ter no mÃ¡ximo 255 caracteres")
    private String responsible;
    
    @Size(max = 255, message = "Departamento deve ter no mÃ¡ximo 255 caracteres")
    private String department;
    
    private BigDecimal budget;
    
    @NotNull(message = "Status Ã© obrigatÃ³rio")
    private CostCenter.CostCenterStatus status;
    
    private UUID createdBy;
}

