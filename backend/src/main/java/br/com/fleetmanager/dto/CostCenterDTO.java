package br.com.fleetmanager.dto;

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

import br.com.fleetmanager.model.CostCenter;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostCenterDTO {
    
    private UUID id;
    
    @NotBlank(message = "Código é obrigatório")
    @Size(max = 20, message = "Código deve ter no máximo 20 caracteres")
    private String code;
    
    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
    private String name;
    
    @Size(max = 1000, message = "Descrição deve ter no máximo 1000 caracteres")
    private String description;
    
    @Size(max = 255, message = "Responsável deve ter no máximo 255 caracteres")
    private String responsible;
    
    @Size(max = 255, message = "Departamento deve ter no máximo 255 caracteres")
    private String department;
    
    private BigDecimal budget;
    
    private BigDecimal currentSpent;
    
    @NotNull(message = "Status é obrigatório")
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