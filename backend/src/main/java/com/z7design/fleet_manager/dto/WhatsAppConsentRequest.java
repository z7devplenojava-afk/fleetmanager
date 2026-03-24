package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WhatsAppConsentRequest {
    
    @NotNull(message = "User ID Ã© obrigatÃ³rio")
    private UUID userId;
    
    @Pattern(regexp = "^\\d{9,20}$", message = "NÃºmero do WhatsApp deve conter apenas dÃ­gitos (9-20 caracteres)")
    private String whatsappNumber; // Opcional - pode atualizar nÃºmero ao dar consentimento
}


