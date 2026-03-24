package com.z7design.fleet_manager.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateFolderRequest {
    
    @NotBlank(message = "Nome da pasta Ã© obrigatÃ³rio")
    private String name;
    
    private String parentPath = "/";
    
    private String description;
}

