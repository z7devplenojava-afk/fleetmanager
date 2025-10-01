package br.com.fleetmanager.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileUpdateRequest {
    
    @NotBlank(message = "Nome é obrigatório")
    @Size(min = 3, max = 100, message = "Nome deve ter entre 3 e 100 caracteres")
    private String name;
    
    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email inválido")
    private String email;
    
    @Pattern(regexp = "^\\d{9,20}$", message = "O número do WhatsApp deve conter apenas dígitos e ter entre 9 e 20 caracteres")
    private String whatsapp;
    
    // Campos opcionais para alteração de senha
    private String currentPassword;
    
    @Size(min = 6, message = "Nova senha deve ter pelo menos 6 caracteres")
    @Pattern(regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[^a-zA-Z0-9\\s]).*$",
             message = "Nova senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial")
    private String newPassword;
}
