package br.com.fleetmanager.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOrderOfServiceDTO {
    
    @NotNull(message = "ID do funcionário é obrigatório")
    private java.util.UUID employeeId;
    
    @NotBlank(message = "Nome do funcionário é obrigatório")
    private String employeeName;
    
    @NotBlank(message = "CPF do funcionário é obrigatório")
    private String employeeCpf;
    
    @NotBlank(message = "Função é obrigatória")
    private String role;
    
    @NotBlank(message = "Empresa é obrigatória")
    private String company;
    
    @NotBlank(message = "Cliente é obrigatório")
    private String client;
    
    @NotBlank(message = "Posto de trabalho é obrigatório")
    private String workplace;
    
    @NotNull(message = "Salário é obrigatório")
    @Positive(message = "Salário deve ser positivo")
    private BigDecimal salary;
    
    @NotNull(message = "Data de início é obrigatória")
    private LocalDate startDate;
    
    private LocalDate endDate;
} 