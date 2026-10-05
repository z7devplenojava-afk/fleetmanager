package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateDriverDTO {
    @NotBlank(message = "O nome do motorista 	 obrigat	rio.")
    private String name;
    private String licenseNumber;
    private String phone;
    private String status = "ATIVO";
    private String cpf;
    /** A, B, C, D, E, ACC */
    private String cnhCategory;
    /** yyyy-MM-dd */
    private java.time.LocalDate cnhExpiration;
    private String photoUrl;
    /** Vinculo com usuario ja cadastrado */
    private java.util.UUID userId;
} 
