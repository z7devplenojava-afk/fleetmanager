package com.z7design.fleet_manager.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
@Schema(description = "DTO para transferÃªncia de dados de fornecedor")
public class SupplierDTO {
    
    private java.util.UUID id;
    
    @NotBlank(message = "Nome Ã© obrigatÃ³rio")
    @Schema(description = "Nome do fornecedor", example = "Empresa ABC Ltda")
    private String name;
    
    @NotBlank(message = "CNPJ Ã© obrigatÃ³rio")
    @Pattern(regexp = "\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}", message = "CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX")
    @Schema(description = "CNPJ do fornecedor", example = "12.345.678/0001-90")
    private String cnpj;
    
    @Email(message = "Email deve ser vÃ¡lido")
    @Schema(description = "Email do fornecedor", example = "contato@empresaabc.com")
    private String email;
    
    @Schema(description = "Telefone do fornecedor", example = "(11) 99999-9999")
    private String phone;
    
    @Schema(description = "EndereÃ§o completo do fornecedor", example = "Rua das Flores, 123")
    private String address;
    
    @Schema(description = "Cidade do fornecedor", example = "SÃ£o Paulo")
    private String city;
    
    @Schema(description = "Estado do fornecedor", example = "SP")
    private String state;
    
    @Schema(description = "CEP do fornecedor", example = "01234-567")
    private String zipCode;
    
    @Schema(description = "Categoria do fornecedor", example = "Tecnologia")
    private String category;
    
    @Schema(description = "ObservaÃ§Ãµes sobre o fornecedor")
    private String notes;
    
    @Schema(description = "Indica se o fornecedor estÃ¡ ativo", example = "true")
    private Boolean isActive = true;
} 
