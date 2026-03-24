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
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostCenterDTO {
    
    private UUID id;
    
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
    
    private BigDecimal currentSpent;
    
    @NotNull(message = "Status Ã© obrigatÃ³rio")
    private CostCenter.CostCenterStatus status;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    private UUID createdBy;
    
    private UUID updatedBy;
    
    // Campos calculados
    private BigDecimal availableBudget;
    
    private BigDecimal utilizationPercentage;
    
    private Boolean isOverBudget;
    
    private Boolean isNearBudgetLimit;
    
    public static CostCenterDTO fromEntity(CostCenter entity) {
        if (entity == null) return null;
        
        return CostCenterDTO.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .description(entity.getDescription())
                .responsible(entity.getResponsible())
                .department(entity.getDepartment())
                .budget(entity.getBudget())
                .currentSpent(entity.getCurrentSpent())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .createdBy(entity.getCreatedBy())
                .updatedBy(entity.getUpdatedBy())
                .availableBudget(entity.getAvailableBudget())
                .utilizationPercentage(entity.getUtilizationPercentage())
                .isOverBudget(entity.isOverBudget())
                .isNearBudgetLimit(entity.isNearBudgetLimit())
                .build();
    }
}
