package com.z7design.fleet_manager.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateRoleDTO {
    
    @NotBlank(message = "Nome do role Ã© obrigatÃ³rio")
    @Size(min = 2, max = 50, message = "Nome deve ter entre 2 e 50 caracteres")
    private String name;
    
    @NotBlank(message = "DescriÃ§Ã£o do role Ã© obrigatÃ³ria")
    @Size(min = 5, max = 200, message = "DescriÃ§Ã£o deve ter entre 5 e 200 caracteres")
    private String description;
    
    private Set<String> permissionNames;
} 
