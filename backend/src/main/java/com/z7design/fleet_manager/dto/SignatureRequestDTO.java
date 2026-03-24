package com.z7design.fleet_manager.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignatureRequestDTO {
    
    @NotNull(message = "ID do documento Ã© obrigatÃ³rio")
    private UUID documentId;
    
    @NotBlank(message = "Nome do signatÃ¡rio Ã© obrigatÃ³rio")
    private String signerName;
    
    @NotBlank(message = "CPF do signatÃ¡rio Ã© obrigatÃ³rio")
    @Pattern(regexp = "^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$", message = "CPF deve estar no formato 000.000.000-00")
    private String signerCpf;
    
    @NotBlank(message = "Cargo/funÃ§Ã£o do signatÃ¡rio Ã© obrigatÃ³rio")
    private String signerRole;
    
    private String signerIp; // Opcional, serÃ¡ preenchido pelo controller
} 
