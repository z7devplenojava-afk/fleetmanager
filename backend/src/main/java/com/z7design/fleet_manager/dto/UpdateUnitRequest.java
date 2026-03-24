package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.Email;
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
public class UpdateUnitRequest {
    
    @Size(min = 3, max = 100, message = "Nome deve ter entre 3 e 100 caracteres")
    private String name;
    
    @Size(max = 500, message = "DescriÃ§Ã£o nÃ£o pode exceder 500 caracteres")
    private String description;
    
    @Size(min = 5, max = 255, message = "EndereÃ§o deve ter entre 5 e 255 caracteres")
    private String address;
    
    @Pattern(regexp = "^(\\()?[0-9]{2}(\\))?\\s?[0-9]{4,5}-?[0-9]{4}$", 
             message = "Telefone deve estar no formato (XX) XXXX-XXXX ou (XX) XXXXX-XXXX")
    private String phone;
    
    @Email(message = "Formato de email invÃ¡lido")
    private String email;
    
    @Size(max = 20, message = "CÃ³digo nÃ£o pode exceder 20 caracteres")
    private String code;
    
    @Size(max = 100, message = "Nome do gerente nÃ£o pode exceder 100 caracteres")
    private String manager;
    
    private UUID parentId;
    private UUID clientId;
}
