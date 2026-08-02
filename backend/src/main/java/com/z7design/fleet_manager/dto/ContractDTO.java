package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.ContractStatus;
import com.z7design.fleet_manager.model.enums.ContractType;
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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "DTO para Contrato")
public class ContractDTO {
    
    private java.util.UUID id;
    
    @Schema(description = "NÃºmero do contrato", example = "CON-2024-001")
    @NotBlank(message = "NÃºmero do contrato Ã© obrigatÃ³rio")
    @Size(max = 50, message = "NÃºmero do contrato deve ter no mÃ¡ximo 50 caracteres")
    private String contractNumber;
    
    @Schema(description = "DescriÃ§Ã£o do contrato", example = "Contrato de prestaÃ§Ã£o de serviÃ§os de seguranÃ§a")
    @NotBlank(message = "DescriÃ§Ã£o Ã© obrigatÃ³ria")
    @Size(max = 500, message = "DescriÃ§Ã£o deve ter no mÃ¡ximo 500 caracteres")
    private String description;
    
    @Schema(description = "Data de inÃ­cio do contrato", example = "2024-01-01")
    @NotNull(message = "Data de inÃ­cio Ã© obrigatÃ³ria")
    private LocalDate startDate;
    
    @Schema(description = "Data de tÃ©rmino do contrato", example = "2024-12-31")
    private LocalDate endDate;
    
    @Schema(description = "Valor do contrato", example = "50000.00")
    @NotNull(message = "Valor Ã© obrigatÃ³rio")
    private BigDecimal value;
    
    @Schema(description = "Status do contrato", example = "ACTIVE")
    private ContractStatus status;
    
    @Schema(description = "Tipo do contrato", example = "LOCACAO_VEICULOS")
    private ContractType contractType;
    
    @Schema(description = "ObservaÃ§Ãµes sobre o contrato")
    @Size(max = 1000, message = "ObservaÃ§Ãµes deve ter no mÃ¡ximo 1000 caracteres")
    private String notes;
    
    @Schema(description = "ID do cliente", example = "1")
    @NotNull(message = "ID do cliente Ã© obrigatÃ³rio")
    private java.util.UUID clientId;
    
    // Campos adicionais para resposta
    @Schema(description = "Nome do cliente")
    private String clientName;
    
    @Schema(description = "CNPJ do cliente")
    private String clientCnpj;
    
    @Schema(description = "Data de criaÃ§Ã£o")
    private LocalDateTime createdAt;
    
    @Schema(description = "Data de atualizaÃ§Ã£o")
    private LocalDateTime updatedAt;
} 
