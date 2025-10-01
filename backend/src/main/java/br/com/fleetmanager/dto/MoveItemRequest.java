package br.com.fleetmanager.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MoveItemRequest {
    
    @NotBlank(message = "Caminho de destino é obrigatório")
    private String targetPath;
}
