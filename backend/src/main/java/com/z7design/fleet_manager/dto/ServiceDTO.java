package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.Service;
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
public class ServiceDTO {
    
    private UUID id;
    
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
    
    @NotNull(message = "Status Ã© obrigatÃ³rio")
    private Service.ServiceStatus status;
    
    private Boolean isBillable;
    
    private Boolean requiresEquipment;
    
    private Boolean requiresCertification;
    
    private Integer estimatedDurationHours;
    
    private Integer minEmployeesRequired;
    
    private Integer maxEmployeesAllowed;
    
    @Size(max = 500, message = "ObservaÃ§Ãµes devem ter no mÃ¡ximo 500 caracteres")
    private String notes;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    private UUID createdBy;
    
    private UUID updatedBy;
    
    // Campos calculados
    private String displayName;
    
    private Boolean isActive;
    
    private Boolean canBeBilled;
    
    public static ServiceDTO fromEntity(Service entity) {
        if (entity == null) {
            return null;
        }
        
        return ServiceDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .category(entity.getCategory())
                .code(entity.getCode())
                .unitPrice(entity.getUnitPrice())
                .unit(entity.getUnit())
                .status(entity.getStatus())
                .isBillable(entity.getIsBillable())
                .requiresEquipment(entity.getRequiresEquipment())
                .requiresCertification(entity.getRequiresCertification())
                .estimatedDurationHours(entity.getEstimatedDurationHours())
                .minEmployeesRequired(entity.getMinEmployeesRequired())
                .maxEmployeesAllowed(entity.getMaxEmployeesAllowed())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .createdBy(entity.getCreatedBy())
                .updatedBy(entity.getUpdatedBy())
                .displayName(entity.getDisplayName())
                .isActive(entity.isActive())
                .canBeBilled(entity.canBeBilled())
                .build();
    }
    
    public Service toEntity() {
        return Service.builder()
                .id(this.id)
                .name(this.name)
                .description(this.description)
                .category(this.category)
                .code(this.code)
                .unitPrice(this.unitPrice)
                .unit(this.unit)
                .status(this.status)
                .isBillable(this.isBillable)
                .requiresEquipment(this.requiresEquipment)
                .requiresCertification(this.requiresCertification)
                .estimatedDurationHours(this.estimatedDurationHours)
                .minEmployeesRequired(this.minEmployeesRequired)
                .maxEmployeesAllowed(this.maxEmployeesAllowed)
                .notes(this.notes)
                .createdBy(this.createdBy)
                .updatedBy(this.updatedBy)
                .build();
    }
}
