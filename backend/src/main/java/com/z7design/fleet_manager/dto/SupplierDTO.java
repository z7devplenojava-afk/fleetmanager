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
    
    @NotBlank(message = "Nome é obrigatório")
    @Schema(description = "Nome / Razão Social do fornecedor", example = "Empresa ABC Ltda")
    private String name;
    
    @Schema(description = "Razão Social / Nome Fantasia do fornecedor", example = "ABC Distribuidora")
    private String tradeName;
    
    @Schema(description = "Nome do contato / representante", example = "Carlos Souza")
    private String contactName;
    
    @Schema(description = "Número de cadastro / Inscrição", example = "376")
    private String registrationNumber;
    
    @Schema(description = "CPF ou CNPJ do fornecedor (com ou sem máscara)", example = "12.345.678/0001-90")
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
