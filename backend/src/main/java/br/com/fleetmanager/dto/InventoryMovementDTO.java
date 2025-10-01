package br.com.fleetmanager.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import br.com.fleetmanager.model.InventoryMovement;

@Data
@Schema(description = "DTO para transferência de dados de movimentação de estoque")
public class InventoryMovementDTO {
    
    @Schema(description = "ID da movimentação", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID id;
    
    @NotNull(message = "ID do item é obrigatório")
    @Schema(description = "ID do item", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID itemId;
    
    @NotBlank(message = "Nome do item é obrigatório")
    @Schema(description = "Nome do item", example = "Camisa Social Azul")
    private String itemName;
    
    @NotNull(message = "Tipo de movimentação é obrigatório")
    @Schema(description = "Tipo de movimentação", example = "OUT")
    private InventoryMovement.MovementType type;
    
    @NotNull(message = "Quantidade é obrigatória")
    @Min(value = 1, message = "Quantidade deve ser maior que zero")
    @Schema(description = "Quantidade movimentada", example = "5")
    private Integer quantity;
    
    @Schema(description = "Quantidade anterior", example = "50")
    private Integer previousQuantity;
    
    @Schema(description = "Nova quantidade", example = "45")
    private Integer newQuantity;
    
    @DecimalMin(value = "0.01", message = "Preço unitário deve ser maior que zero")
    @Schema(description = "Preço unitário", example = "75.00")
    private BigDecimal unitPrice;
    
    @Schema(description = "Valor total da movimentação", example = "375.00")
    private BigDecimal totalValue;
    
    @NotBlank(message = "Motivo é obrigatório")
    @Size(max = 200, message = "Motivo deve ter no máximo 200 caracteres")
    @Schema(description = "Motivo da movimentação", example = "Entrega para funcionário")
    private String reason;
    
    @Size(max = 100, message = "Solicitante deve ter no máximo 100 caracteres")
    @Schema(description = "Solicitante", example = "João Silva")
    private String requester;
    
    @Size(max = 100, message = "Aprovador deve ter no máximo 100 caracteres")
    @Schema(description = "Aprovador", example = "Maria Santos")
    private String approvedBy;
    
    @Size(max = 50, message = "ID do funcionário deve ter no máximo 50 caracteres")
    @Schema(description = "ID do funcionário", example = "EMP001")
    private String employeeId;
    
    @Size(max = 100, message = "Nome do funcionário deve ter no máximo 100 caracteres")
    @Schema(description = "Nome do funcionário", example = "João Silva")
    private String employeeName;
    
    @Size(max = 100, message = "Departamento deve ter no máximo 100 caracteres")
    @Schema(description = "Departamento", example = "Segurança")
    private String department;
    
    @Size(max = 100, message = "Localização deve ter no máximo 100 caracteres")
    @Schema(description = "Localização", example = "Sede Principal")
    private String location;
    
    @Size(max = 1000, message = "Observações deve ter no máximo 1000 caracteres")
    @Schema(description = "Observações sobre a movimentação")
    private String notes;
    
    @NotNull(message = "Status é obrigatório")
    @Schema(description = "Status da movimentação", example = "COMPLETED")
    private InventoryMovement.MovementStatus status;
    
    @Schema(description = "Data da movimentação", example = "2024-01-15T10:30:00")
    private LocalDateTime movementDate;
    
    // Campos calculados para exibição
    @Schema(description = "Categoria do item", example = "UNIFORMS")
    private String itemCategory;
    
    @Schema(description = "Tipo do item", example = "SHIRT")
    private String itemType;
    
    @Schema(description = "Tamanho do item", example = "M")
    private String itemSize;
    
    @Schema(description = "Cor do item", example = "Azul Marinho")
    private String itemColor;
} 