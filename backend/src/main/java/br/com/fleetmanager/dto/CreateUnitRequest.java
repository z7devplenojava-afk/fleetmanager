package br.com.fleetmanager.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateUnitRequest {
    
    @NotBlank(message = "Nome é obrigatório")
    @Size(min = 3, max = 100, message = "Nome deve ter entre 3 e 100 caracteres")
    private String name;
    
    @Size(max = 500, message = "Descrição não pode exceder 500 caracteres")
    private String description;
    
    @NotBlank(message = "Endereço é obrigatório")
    @Size(min = 5, max = 255, message = "Endereço deve ter entre 5 e 255 caracteres")
    private String address;
    
    @Pattern(regexp = "^(\\()?[0-9]{2}(\\))?\\s?[0-9]{4,5}-?[0-9]{4}$", 
             message = "Telefone deve estar no formato (XX) XXXX-XXXX ou (XX) XXXXX-XXXX")
    private String phone;
    
    @Email(message = "Formato de email inválido")
    private String email;
    
    @Size(max = 20, message = "Código não pode exceder 20 caracteres")
    private String code;
    
    @Size(max = 100, message = "Nome do gerente não pode exceder 100 caracteres")
    private String manager;
    
    private UUID parentId;
    private UUID clientId;
}