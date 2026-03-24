package com.z7design.fleet_manager.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RenameItemRequest {
    
    @NotBlank(message = "Novo nome Ã© obrigatÃ³rio")
    private String newName;
}

