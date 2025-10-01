package br.com.fleetmanager.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.UUID;

import br.com.fleetmanager.model.Company;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "DTO para dados de empresa")
public class CompanyDTO {

    @Schema(description = "ID único da empresa")
    private UUID id;

    @NotBlank(message = "Nome da empresa é obrigatório")
    @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
    @Schema(description = "Nome da empresa", example = "Empresa ABC Ltda")
    private String name;

    @Size(max = 255, message = "Nome fantasia deve ter no máximo 255 caracteres")
    @Schema(description = "Nome fantasia", example = "ABC Ltda")
    private String tradeName;

    @Size(max = 18, message = "CNPJ deve ter no máximo 18 caracteres")
    @Schema(description = "CNPJ da empresa", example = "12.345.678/0001-99")
    private String cnpj;

    @Size(max = 20, message = "Inscrição estadual deve ter no máximo 20 caracteres")
    @Schema(description = "Inscrição estadual")
    private String inscricaoEstadual;

    @Size(max = 20, message = "Inscrição municipal deve ter no máximo 20 caracteres")
    @Schema(description = "Inscrição municipal")
    private String inscricaoMunicipal;

    @Size(max = 500, message = "Endereço deve ter no máximo 500 caracteres")
    @Schema(description = "Endereço completo", example = "Av. das Empresas, 123, Centro")
    private String address;

    @Size(max = 100, message = "Cidade deve ter no máximo 100 caracteres")
    @Schema(description = "Cidade", example = "Belo Horizonte")
    private String city;

    @Size(max = 2, message = "Estado deve ter no máximo 2 caracteres")
    @Schema(description = "Estado", example = "MG")
    private String state;

    @Size(max = 10, message = "CEP deve ter no máximo 10 caracteres")
    @Schema(description = "CEP", example = "30123-456")
    private String zipCode;

    @Size(max = 20, message = "Telefone deve ter no máximo 20 caracteres")
    @Schema(description = "Telefone", example = "(31) 3333-4444")
    private String phone;

    @Email(message = "Email deve ser válido")
    @Size(max = 255, message = "Email deve ter no máximo 255 caracteres")
    @Schema(description = "Email da empresa", example = "contato@empresa.com")
    private String email;

    @Size(max = 255, message = "Website deve ter no máximo 255 caracteres")
    @Schema(description = "Website", example = "https://www.empresa.com")
    private String website;

    @Size(max = 255, message = "Pessoa de contato deve ter no máximo 255 caracteres")
    @Schema(description = "Pessoa de contato", example = "João Silva")
    private String contactPerson;

    @Size(max = 20, message = "Telefone de contato deve ter no máximo 20 caracteres")
    @Schema(description = "Telefone de contato", example = "(31) 99999-8888")
    private String contactPhone;

    @Email(message = "Email de contato deve ser válido")
    @Size(max = 255, message = "Email de contato deve ter no máximo 255 caracteres")
    @Schema(description = "Email de contato", example = "joao@empresa.com")
    private String contactEmail;

    @Size(max = 1000, message = "Descrição deve ter no máximo 1000 caracteres")
    @Schema(description = "Descrição da empresa")
    private String description;

    @Schema(description = "Status da empresa")
    private Company.CompanyStatus status;

    @Size(max = 50, message = "Tipo deve ter no máximo 50 caracteres")
    @Schema(description = "Tipo da empresa", example = "LTDA")
    private String type;

    @Size(max = 100, message = "Setor deve ter no máximo 100 caracteres")
    @Schema(description = "Setor de atuação", example = "Tecnologia")
    private String sector;

    @Size(max = 50, message = "Tamanho deve ter no máximo 50 caracteres")
    @Schema(description = "Tamanho da empresa", example = "Média")
    private String size;

    @Schema(description = "Receita anual", example = "1000000.00")
    private Double annualRevenue;

    @Schema(description = "Número de funcionários", example = "50")
    private Integer employeeCount;

    @Size(max = 1000, message = "Observações deve ter no máximo 1000 caracteres")
    @Schema(description = "Observações")
    private String notes;

    @Schema(description = "Data de criação")
    private LocalDateTime createdAt;

    @Schema(description = "Data de atualização")
    private LocalDateTime updatedAt;

    @Schema(description = "ID do usuário que criou")
    private UUID createdBy;

    @Schema(description = "ID do usuário que atualizou")
    private UUID updatedBy;
} 