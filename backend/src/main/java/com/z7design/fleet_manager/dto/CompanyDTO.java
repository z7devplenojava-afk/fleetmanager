package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Company.CompanyStatus;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyDTO {
    
    private UUID id;
    
    @NotBlank(message = "Company name is required")
    @Size(max = 100, message = "Company name must not exceed 100 characters")
    private String name;
    
    @NotBlank(message = "Company sigla is required")
    @Size(min = 2, max = 10, message = "Company sigla must be between 2 and 10 characters")
    private String sigla;
    
    private String description;
    
    @Size(max = 18, message = "CNPJ must not exceed 18 characters")
    private String cnpj;
    
    @Size(max = 255, message = "Address must not exceed 255 characters")
    private String address;
    
    // Campos de endereÃ§o separados
    @Size(max = 255, message = "Street must not exceed 255 characters")
    private String enderecoRua;
    
    @Size(max = 20, message = "Number must not exceed 20 characters")
    private String enderecoNumero;
    
    @Size(max = 100, message = "Complement must not exceed 100 characters")
    private String enderecoComplemento;
    
    @Size(max = 100, message = "Neighborhood must not exceed 100 characters")
    private String enderecoBairro;
    
    @Size(max = 100, message = "City must not exceed 100 characters")
    private String city;
    
    @Size(max = 2, message = "State must not exceed 2 characters")
    private String state;
    
    @Size(max = 10, message = "Zip code must not exceed 10 characters")
    private String zipCode;
    
    @Size(max = 20, message = "Phone must not exceed 20 characters")
    private String phone;
    
    @Email(message = "Invalid email format")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;
    
    @Size(max = 255, message = "Website must not exceed 255 characters")
    private String website;
    
    @Size(max = 500, message = "Logo URL must not exceed 500 characters")
    private String logoUrl;
    
    @NotNull(message = "Company status is required")
    private CompanyStatus status;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // EPIs padrÃ£o da primeira entrega
    private List<CompanyDefaultEPIDTO> defaultEpis;
    
    // MÃ©todos de conversÃ£o
    public static CompanyDTO fromEntity(Company company) {
        if (company == null) {
            return null;
        }
        
        return CompanyDTO.builder()
                .id(company.getId())
                .name(company.getName())
                .sigla(company.getSigla())
                .description(company.getDescription())
                .cnpj(company.getCnpj())
                .address(company.getAddress())
                .enderecoRua(company.getEnderecoRua())
                .enderecoNumero(company.getEnderecoNumero())
                .enderecoComplemento(company.getEnderecoComplemento())
                .enderecoBairro(company.getEnderecoBairro())
                .city(company.getCity())
                .state(company.getState())
                .zipCode(company.getZipCode())
                .phone(company.getPhone())
                .email(company.getEmail())
                .website(company.getWebsite())
                .logoUrl(company.getLogoUrl())
                .status(company.getStatus())
                .defaultEpis(company.getDefaultEpis() != null 
                    ? company.getDefaultEpis().stream()
                        .map(CompanyDefaultEPIDTO::fromEntity)
                        .collect(Collectors.toList())
                    : null)
                .createdAt(company.getCreatedAt())
                .updatedAt(company.getUpdatedAt())
                .build();
    }
    
    public Company toEntity() {
        Company company = new Company();
        company.setId(this.id);
        company.setName(this.name);
        company.setSigla(this.sigla);
        company.setDescription(this.description);
        company.setCnpj(this.cnpj);
        company.setAddress(this.address);
        company.setEnderecoRua(this.enderecoRua);
        company.setEnderecoNumero(this.enderecoNumero);
        company.setEnderecoComplemento(this.enderecoComplemento);
        company.setEnderecoBairro(this.enderecoBairro);
        company.setCity(this.city);
        company.setState(this.state);
        company.setZipCode(this.zipCode);
        company.setPhone(this.phone);
        company.setEmail(this.email);
        company.setWebsite(this.website);
        company.setLogoUrl(this.logoUrl);
        company.setStatus(this.status);
        return company;
    }
}
