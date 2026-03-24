package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request para atualizar nÃºmero de WhatsApp de um usuÃ¡rio
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateWhatsAppRequest {
    
    /**
     * NÃºmero de WhatsApp (9-20 dÃ­gitos, apenas nÃºmeros)
     */
    @NotBlank(message = "WhatsApp number is required")
    @Pattern(regexp = "^\\d{9,20}$", message = "WhatsApp deve conter apenas dÃ­gitos (9-20 caracteres)")
    private String whatsapp;
}


