package br.com.fleetmanager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateFuelStationDTO {
    
    @NotBlank(message = "O nome do posto é obrigatório")
    private String name;
    
    @NotBlank(message = "O endereço é obrigatório")
    private String address;
    
    private String city;
    
    private String state;
    
    @Pattern(regexp = "\\d{5}-\\d{3}", message = "CEP deve estar no formato 00000-000")
    private String zipCode;
    
    @Pattern(regexp = "^(|\\(\\d{2}\\) \\d{4,5}-\\d{4})$", message = "Telefone deve estar no formato (00) 00000-0000 ou vazio")
    private String phone;
    
    @Email(message = "Email deve ser válido")
    private String email;
    
    @Pattern(regexp = "\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}", message = "CNPJ deve estar no formato 00.000.000/0000-00")
    private String cnpj;
    
    private String brand; // Marca da bandeira
    
    private String manager;
    
    @Pattern(regexp = "\\(\\d{2}\\) \\d{4,5}-\\d{4}", message = "Telefone do gerente deve estar no formato (00) 00000-0000")
    private String managerPhone;
    
    @Email(message = "Email do gerente deve ser válido")
    private String managerEmail;
    
    private String operatingHours;
    
    private String services;
    
    private String paymentMethods;
    
    private BigDecimal latitude;
    
    private BigDecimal longitude;
    
    private String notes;
}
