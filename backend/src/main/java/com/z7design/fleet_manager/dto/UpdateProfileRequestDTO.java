package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequestDTO {
    
    @Email(message = "Email invÃ¡lido")
    private String email;
    
    private String name;
    
    @Pattern(regexp = "^\\d{9,20}$", message = "O nÃºmero do WhatsApp deve conter apenas dÃ­gitos e ter entre 9 e 20 caracteres")
    private String whatsapp;
}


