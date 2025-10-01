package br.com.fleetmanager.dto;

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
    
    @NotNull(message = "ID do documento é obrigatório")
    private UUID documentId;
    
    @NotBlank(message = "Nome do signatário é obrigatório")
    private String signerName;
    
    @NotBlank(message = "CPF do signatário é obrigatório")
    @Pattern(regexp = "^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$", message = "CPF deve estar no formato 000.000.000-00")
    private String signerCpf;
    
    @NotBlank(message = "Cargo/função do signatário é obrigatório")
    private String signerRole;
    
    private String signerIp; // Opcional, será preenchido pelo controller
} 