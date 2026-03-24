package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyConfigDTO {

    private UUID id;

    @NotBlank(message = "Nome da empresa Ã© obrigatÃ³rio")
    @Size(min = 3, max = 200, message = "Nome deve ter entre 3 e 200 caracteres")
    private String name;

    @NotBlank(message = "CNPJ Ã© obrigatÃ³rio")
    @Size(min = 14, max = 18, message = "CNPJ deve ter formato vÃ¡lido")
    private String cnpj;

    @NotBlank(message = "EndereÃ§o Ã© obrigatÃ³rio")
    @Size(max = 500, message = "EndereÃ§o nÃ£o pode exceder 500 caracteres")
    private String address;

    @NotBlank(message = "Cidade Ã© obrigatÃ³ria")
    @Size(max = 100, message = "Cidade nÃ£o pode exceder 100 caracteres")
    private String city;

    @NotBlank(message = "Estado Ã© obrigatÃ³rio")
    @Size(min = 2, max = 2, message = "Estado deve ter 2 caracteres")
    private String state;

    @NotBlank(message = "CEP Ã© obrigatÃ³rio")
    @Size(min = 8, max = 10, message = "CEP deve ter formato vÃ¡lido")
    private String zipCode;

    @NotBlank(message = "Telefone Ã© obrigatÃ³rio")
    @Size(max = 20, message = "Telefone nÃ£o pode exceder 20 caracteres")
    private String phone;

    @NotBlank(message = "Email Ã© obrigatÃ³rio")
    @Email(message = "Email deve ter formato vÃ¡lido")
    @Size(max = 100, message = "Email nÃ£o pode exceder 100 caracteres")
    private String email;

    @Size(max = 100, message = "Website nÃ£o pode exceder 100 caracteres")
    private String website;

    private String logoUrl;

    @Size(max = 200, message = "Texto do cabeÃ§alho nÃ£o pode exceder 200 caracteres")
    private String headerText;

    @Size(max = 500, message = "Texto do rodapÃ© nÃ£o pode exceder 500 caracteres")
    private String footerText;

    private String contractTerms;

    private Boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}

