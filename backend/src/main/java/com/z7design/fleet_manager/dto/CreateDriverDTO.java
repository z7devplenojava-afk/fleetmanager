package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateDriverDTO {
    @NotBlank(message = "O nome do motorista Ã© obrigatÃ³rio.")
    private String name;
    private String licenseNumber;
    private String status = "ATIVO";
} 
