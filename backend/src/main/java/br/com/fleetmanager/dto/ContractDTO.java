package br.com.fleetmanager.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import br.com.fleetmanager.model.enums.ContractStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "DTO para Contrato")
public class ContractDTO {
    
    private java.util.UUID id;
    
    @Schema(description = "Número do contrato", example = "CON-2024-001")
    @NotBlank(message = "Número do contrato é obrigatório")
    @Size(max = 50, message = "Número do contrato deve ter no máximo 50 caracteres")
    private String contractNumber;
    
    @Schema(description = "Descrição do contrato", example = "Contrato de prestação de serviços de segurança")
    @NotBlank(message = "Descrição é obrigatória")
    @Size(max = 500, message = "Descrição deve ter no máximo 500 caracteres")
    private String description;
    
    @Schema(description = "Data de início do contrato", example = "2024-01-01")
    @NotNull(message = "Data de início é obrigatória")
    private LocalDate startDate;
    
    @Schema(description = "Data de término do contrato", example = "2024-12-31")
    private LocalDate endDate;
    
    @Schema(description = "Valor do contrato", example = "50000.00")
    @NotNull(message = "Valor é obrigatório")
    private BigDecimal value;
    
    @Schema(description = "Status do contrato", example = "ACTIVE")
    private ContractStatus status;
    
    @Schema(description = "Observações sobre o contrato")
    @Size(max = 1000, message = "Observações deve ter no máximo 1000 caracteres")
    private String notes;
    
    @Schema(description = "ID do cliente", example = "1")
    @NotNull(message = "ID do cliente é obrigatório")
    private java.util.UUID clientId;
    
    // Campos adicionais para resposta
    @Schema(description = "Nome do cliente")
    private String clientName;
    
    @Schema(description = "CNPJ do cliente")
    private String clientCnpj;
    
    @Schema(description = "Data de criação")
    private LocalDateTime createdAt;
    
    @Schema(description = "Data de atualização")
    private LocalDateTime updatedAt;
} 