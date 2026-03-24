package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Request para criaÃ§Ã£o rÃ¡pida de usuÃ¡rio para funcionÃ¡rio
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuickUserCreateRequest {
    
    /**
     * ID do funcionÃ¡rio para vincular
     */
    @NotBlank(message = "Employee ID is required")
    private UUID employeeId;
    
    /**
     * Email do usuÃ¡rio (opcional, usa do employee se nÃ£o fornecido)
     */
    @Email(message = "Invalid email format")
    private String email;
    
    /**
     * NÃºmero de WhatsApp (9-20 dÃ­gitos, apenas nÃºmeros)
     */
    @Pattern(regexp = "^\\d{9,20}$", message = "WhatsApp deve conter apenas dÃ­gitos (9-20 caracteres)")
    private String whatsapp;
    
    /**
     * Se deve enviar email de boas-vindas com credenciais
     */
    private boolean sendWelcomeEmail;
}


