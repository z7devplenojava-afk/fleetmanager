package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CreateSupervisorDTO {
    
    @NotBlank(message = "Nome Ã© obrigatÃ³rio")
    private String name;
    
    @NotBlank(message = "CPF Ã© obrigatÃ³rio")
    @Pattern(regexp = "\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}", message = "CPF deve estar no formato 000.000.000-00")
    private String cpf;
    
    @NotBlank(message = "Email Ã© obrigatÃ³rio")
    @Email(message = "Email deve ser vÃ¡lido")
    private String email;
    
    private String phone;
    
    private Boolean isActive = true;
}

