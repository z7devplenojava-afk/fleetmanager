package br.com.fleetmanager.dto;

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

    @NotBlank(message = "Nome da empresa é obrigatório")
    @Size(min = 3, max = 200, message = "Nome deve ter entre 3 e 200 caracteres")
    private String name;

    @NotBlank(message = "CNPJ é obrigatório")
    @Size(min = 14, max = 18, message = "CNPJ deve ter formato válido")
    private String cnpj;

    @NotBlank(message = "Endereço é obrigatório")
    @Size(max = 500, message = "Endereço não pode exceder 500 caracteres")
    private String address;

    @NotBlank(message = "Cidade é obrigatória")
    @Size(max = 100, message = "Cidade não pode exceder 100 caracteres")
    private String city;

    @NotBlank(message = "Estado é obrigatório")
    @Size(min = 2, max = 2, message = "Estado deve ter 2 caracteres")
    private String state;

    @NotBlank(message = "CEP é obrigatório")
    @Size(min = 8, max = 10, message = "CEP deve ter formato válido")
    private String zipCode;

    @NotBlank(message = "Telefone é obrigatório")
    @Size(max = 20, message = "Telefone não pode exceder 20 caracteres")
    private String phone;

    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email deve ter formato válido")
    @Size(max = 100, message = "Email não pode exceder 100 caracteres")
    private String email;

    @Size(max = 100, message = "Website não pode exceder 100 caracteres")
    private String website;

    private String logoUrl;

    @Size(max = 200, message = "Texto do cabeçalho não pode exceder 200 caracteres")
    private String headerText;

    @Size(max = 500, message = "Texto do rodapé não pode exceder 500 caracteres")
    private String footerText;

    private String contractTerms;

    private Boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
