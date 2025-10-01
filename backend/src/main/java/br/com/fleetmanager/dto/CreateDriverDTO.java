package br.com.fleetmanager.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateDriverDTO {
    @NotBlank(message = "O nome do motorista é obrigatório.")
    private String name;
    private String licenseNumber;
    private String status = "ATIVO";
} 