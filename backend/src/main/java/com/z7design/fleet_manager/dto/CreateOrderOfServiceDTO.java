package com.z7design.fleet_manager.dto;

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
    
    @NotNull(message = "ID do funcionÃ¡rio Ã© obrigatÃ³rio")
    private java.util.UUID employeeId;
    
    @NotBlank(message = "Nome do funcionÃ¡rio Ã© obrigatÃ³rio")
    private String employeeName;
    
    @NotBlank(message = "CPF do funcionÃ¡rio Ã© obrigatÃ³rio")
    private String employeeCpf;
    
    @NotBlank(message = "FunÃ§Ã£o Ã© obrigatÃ³ria")
    private String role;
    
    @NotBlank(message = "Empresa Ã© obrigatÃ³ria")
    private String company;
    
    @NotBlank(message = "Cliente Ã© obrigatÃ³rio")
    private String client;
    
    @NotBlank(message = "Posto de trabalho Ã© obrigatÃ³rio")
    private String workplace;
    
    @NotNull(message = "SalÃ¡rio Ã© obrigatÃ³rio")
    @Positive(message = "SalÃ¡rio deve ser positivo")
    private BigDecimal salary;
    
    @NotNull(message = "Data de inÃ­cio Ã© obrigatÃ³ria")
    private LocalDate startDate;
    
    private LocalDate endDate;
} 
