package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FirstAccessRequestDTO {
    
    @NotBlank(message = "Senha atual Ã© obrigatÃ³ria")
    private String currentPassword;
    
    @NotBlank(message = "Nova senha Ã© obrigatÃ³ria")
    @Size(min = 6, message = "A senha deve ter pelo menos 6 caracteres")
    private String newPassword;
    
    @NotBlank(message = "ConfirmaÃ§Ã£o de senha Ã© obrigatÃ³ria")
    private String confirmPassword;
}


