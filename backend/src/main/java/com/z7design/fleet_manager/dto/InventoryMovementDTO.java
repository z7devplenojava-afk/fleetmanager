package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.InventoryMovement;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Schema(description = "DTO para transferÃªncia de dados de movimentaÃ§Ã£o de estoque")
public class InventoryMovementDTO {
    
    @Schema(description = "ID da movimentaÃ§Ã£o", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID id;
    
    @NotNull(message = "ID do item Ã© obrigatÃ³rio")
    @Schema(description = "ID do item", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID itemId;
    
    @NotBlank(message = "Nome do item Ã© obrigatÃ³rio")
    @Schema(description = "Nome do item", example = "Camisa Social Azul")
    private String itemName;
    
    @NotNull(message = "Tipo de movimentaÃ§Ã£o Ã© obrigatÃ³rio")
    @Schema(description = "Tipo de movimentaÃ§Ã£o", example = "OUT")
    private InventoryMovement.MovementType type;
    
    @NotNull(message = "Quantidade Ã© obrigatÃ³ria")
    @Min(value = 1, message = "Quantidade deve ser maior que zero")
    @Schema(description = "Quantidade movimentada", example = "5")
    private Integer quantity;
    
    @Schema(description = "Quantidade anterior", example = "50")
    private Integer previousQuantity;
    
    @Schema(description = "Nova quantidade", example = "45")
    private Integer newQuantity;
    
    @DecimalMin(value = "0.01", message = "PreÃ§o unitÃ¡rio deve ser maior que zero")
    @Schema(description = "PreÃ§o unitÃ¡rio", example = "75.00")
    private BigDecimal unitPrice;
    
    @Schema(description = "Valor total da movimentaÃ§Ã£o", example = "375.00")
    private BigDecimal totalValue;
    
    @NotBlank(message = "Motivo Ã© obrigatÃ³rio")
    @Size(max = 200, message = "Motivo deve ter no mÃ¡ximo 200 caracteres")
    @Schema(description = "Motivo da movimentaÃ§Ã£o", example = "Entrega para funcionÃ¡rio")
    private String reason;
    
    @Size(max = 100, message = "Solicitante deve ter no mÃ¡ximo 100 caracteres")
    @Schema(description = "Solicitante", example = "JoÃ£o Silva")
    private String requester;
    
    @Size(max = 100, message = "Aprovador deve ter no mÃ¡ximo 100 caracteres")
    @Schema(description = "Aprovador", example = "Maria Santos")
    private String approvedBy;
    
    @Size(max = 50, message = "ID do funcionÃ¡rio deve ter no mÃ¡ximo 50 caracteres")
    @Schema(description = "ID do funcionÃ¡rio", example = "EMP001")
    private String employeeId;
    
    @Size(max = 100, message = "Nome do funcionÃ¡rio deve ter no mÃ¡ximo 100 caracteres")
    @Schema(description = "Nome do funcionÃ¡rio", example = "JoÃ£o Silva")
    private String employeeName;
    
    @Size(max = 100, message = "Departamento deve ter no mÃ¡ximo 100 caracteres")
    @Schema(description = "Departamento", example = "SeguranÃ§a")
    private String department;
    
    @Size(max = 100, message = "LocalizaÃ§Ã£o deve ter no mÃ¡ximo 100 caracteres")
    @Schema(description = "LocalizaÃ§Ã£o", example = "Sede Principal")
    private String location;
    
    @Size(max = 1000, message = "ObservaÃ§Ãµes deve ter no mÃ¡ximo 1000 caracteres")
    @Schema(description = "ObservaÃ§Ãµes sobre a movimentaÃ§Ã£o")
    private String notes;
    
    @NotNull(message = "Status Ã© obrigatÃ³rio")
    @Schema(description = "Status da movimentaÃ§Ã£o", example = "COMPLETED")
    private InventoryMovement.MovementStatus status;
    
    @Schema(description = "Data da movimentaÃ§Ã£o", example = "2024-01-15T10:30:00")
    private LocalDateTime movementDate;
    
    // Campos calculados para exibiÃ§Ã£o
    @Schema(description = "Categoria do item", example = "UNIFORMS")
    private String itemCategory;
    
    @Schema(description = "Tipo do item", example = "SHIRT")
    private String itemType;
    
    @Schema(description = "Tamanho do item", example = "M")
    private String itemSize;
    
    @Schema(description = "Cor do item", example = "Azul Marinho")
    private String itemColor;
} 
