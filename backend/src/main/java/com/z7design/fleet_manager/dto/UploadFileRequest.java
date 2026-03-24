package com.z7design.fleet_manager.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UploadFileRequest {
    
    @NotBlank(message = "Nome do arquivo Ã© obrigatÃ³rio")
    private String fileName;
    
    private String parentPath = "/";
    
    private String description;
}

