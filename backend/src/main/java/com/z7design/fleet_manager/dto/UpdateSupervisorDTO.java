package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateSupervisorDTO {
    
    private String name;
    
    @Pattern(regexp = "\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}", message = "CPF deve estar no formato 000.000.000-00")
    private String cpf;
    
    @Email(message = "Email deve ser vÃ¡lido")
    private String email;
    
    private String phone;
    
    private Boolean isActive;
}

