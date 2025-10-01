package br.com.fleetmanager.dto;

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
@Schema(description = "DTO para Cargo/Posição")
public class PositionDTO {

    private UUID id;

    @Schema(description = "Nome do cargo", example = "Supervisor de Segurança")
    @NotBlank(message = "Nome do cargo é obrigatório")
    @Size(min = 3, max = 100, message = "Nome do cargo deve ter entre 3 e 100 caracteres")
    private String name;

    @Schema(description = "Descrição detalhada do cargo")
    @Size(max = 500, message = "Descrição não pode exceder 500 caracteres")
    private String description;

    @Schema(description = "Salário base do cargo", example = "3500.00")
    @NotNull(message = "Salário base é obrigatório")
    @PositiveOrZero(message = "Salário base deve ser um valor positivo ou zero")
    private BigDecimal baseSalary;

    @Schema(description = "ID da unidade a qual o cargo pertence", example = "a1b2c3d4-e5f6-7890-1234-567890abcdef")
    private UUID unitId;

    private String unitName;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // Método para converter entidade para DTO
    public static PositionDTO fromEntity(br.com.fleetmanager.model.Position entity) {
        return PositionDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .baseSalary(entity.getBaseSalary())
                .unitId(entity.getUnit() != null ? entity.getUnit().getId() : null)
                .unitName(entity.getUnit() != null ? entity.getUnit().getName() : null)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    // Método para converter DTO para entidade (para criação ou atualização)
    public br.com.fleetmanager.model.Position toEntity() {
        br.com.fleetmanager.model.Position entity = new br.com.fleetmanager.model.Position();
        entity.setId(this.id);
        entity.setName(this.name);
        entity.setDescription(this.description);
        entity.setBaseSalary(this.baseSalary);
        // A unidade deve ser setada pelo serviço
        entity.setCreatedAt(this.createdAt);
        entity.setUpdatedAt(this.updatedAt);
        return entity;
    }
}
