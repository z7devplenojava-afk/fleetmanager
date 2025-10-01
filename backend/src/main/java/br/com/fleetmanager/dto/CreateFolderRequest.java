package br.com.fleetmanager.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateFolderRequest {
    
    @NotBlank(message = "Nome da pasta é obrigatório")
    private String name;
    
    private String parentPath = "/";
    
    private String description;
}
