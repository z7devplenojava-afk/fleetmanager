package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthenticationResponse {
    private String token;
    private String refreshToken;
    private UserResponse user;
    private EmpresaResponse empresa;

    // Flags de primeiro acesso e seguranÃ§a
    private Boolean requiresLgpdConsent;
    private Boolean requires2FA;
    private Boolean requiresPasswordChange;
    private Boolean firstAccessCompleted;
} 
