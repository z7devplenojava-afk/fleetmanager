package br.com.fleetmanager.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UploadFileRequest {
    
    @NotBlank(message = "Nome do arquivo é obrigatório")
    private String fileName;
    
    private String parentPath = "/";
    
    private String description;
}
