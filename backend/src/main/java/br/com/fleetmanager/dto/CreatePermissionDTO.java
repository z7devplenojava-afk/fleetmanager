package br.com.fleetmanager.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePermissionDTO {
    
    @NotBlank(message = "Nome da permissão é obrigatório")
    @Size(min = 2, max = 50, message = "Nome deve ter entre 2 e 50 caracteres")
    private String name;
    
    @NotBlank(message = "Descrição da permissão é obrigatória")
    @Size(min = 5, max = 200, message = "Descrição deve ter entre 5 e 200 caracteres")
    private String description;
} 