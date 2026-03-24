package com.z7design.fleet_manager.dto;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthenticationRequest {
    @NotBlank(message = "Username is required")
    private String username;
    @NotBlank(message = "Password is required")
    private String password;

    /**
     * ID da empresa selecionada no login (obrigatório)
     * O usuário deve selecionar uma empresa antes de fazer login
     */
    private UUID companyId;
}
