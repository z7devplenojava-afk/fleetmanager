package com.z7design.fleet_manager.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
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
@Schema(description = "DTO para Cargo/PosiÃ§Ã£o")
public class PositionDTO {

    private UUID id;

    @Schema(description = "Nome do cargo", example = "Supervisor de SeguranÃ§a")
    @NotBlank(message = "Nome do cargo Ã© obrigatÃ³rio")
    @Size(min = 3, max = 100, message = "Nome do cargo deve ter entre 3 e 100 caracteres")
    private String name;

    @Schema(description = "DescriÃ§Ã£o detalhada do cargo")
    @Size(max = 500, message = "DescriÃ§Ã£o nÃ£o pode exceder 500 caracteres")
    private String description;

    @Schema(description = "CÃ³digo Brasileiro de OcupaÃ§Ã£o (CBO)", example = "5171-10")
    @Size(max = 10, message = "CBO nÃ£o pode exceder 10 caracteres")
    private String cbo;

    @Schema(description = "SalÃ¡rio base do cargo", example = "3500.00")
    @NotNull(message = "SalÃ¡rio base Ã© obrigatÃ³rio")
    @PositiveOrZero(message = "SalÃ¡rio base deve ser um valor positivo ou zero")
    private BigDecimal baseSalary;

    @Schema(description = "ID da unidade a qual o cargo pertence", example = "a1b2c3d4-e5f6-7890-1234-567890abcdef")
    private UUID unitId;

    private String unitName;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // MÃ©todo para converter entidade para DTO
    public static PositionDTO fromEntity(com.z7design.fleet_manager.model.Position entity) {
        if (entity == null) {
            return null;
        }
        
        return PositionDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .cbo(entity.getCbo())
                .baseSalary(entity.getBaseSalary())
                .unitId(entity.getUnit() != null ? entity.getUnit().getId() : null)
                .unitName(entity.getUnit() != null ? entity.getUnit().getName() : "Sem unidade")
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    // MÃ©todo para converter DTO para entidade (para criaÃ§Ã£o ou atualizaÃ§Ã£o)
    public com.z7design.fleet_manager.model.Position toEntity() {
        com.z7design.fleet_manager.model.Position entity = new com.z7design.fleet_manager.model.Position();
        entity.setId(this.id);
        entity.setName(this.name);
        entity.setDescription(this.description);
        entity.setCbo(this.cbo);
        entity.setBaseSalary(this.baseSalary);
        // A unidade deve ser setada pelo serviÃ§o
        entity.setCreatedAt(this.createdAt);
        entity.setUpdatedAt(this.updatedAt);
        return entity;
    }
}

