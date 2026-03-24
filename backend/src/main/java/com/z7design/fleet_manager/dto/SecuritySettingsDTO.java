package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecuritySettingsDTO {
    
    private String id;
    
    private String companyId;
    
    // ConfiguraÃ§Ãµes de 2FA
    @NotNull(message = "2FA habilitado Ã© obrigatÃ³rio")
    private Boolean twoFactorEnabled;
    
    private String twoFactorMethod; // EMAIL, SMS, APP
    
    // PolÃ­ticas de senha
    @NotNull(message = "ExpiraÃ§Ã£o de senha Ã© obrigatÃ³ria")
    private Boolean passwordExpiryEnabled;
    
    @Min(value = 1, message = "Dias de expiraÃ§Ã£o deve ser maior que 0")
    private Integer passwordExpiryDays;
    
    @Min(value = 6, message = "Tamanho mÃ­nimo da senha deve ser pelo menos 6")
    private Integer passwordMinLength;
    
    @NotNull(message = "Requisito de maiÃºscula Ã© obrigatÃ³rio")
    private Boolean passwordRequireUppercase;
    
    @NotNull(message = "Requisito de minÃºscula Ã© obrigatÃ³rio")
    private Boolean passwordRequireLowercase;
    
    @NotNull(message = "Requisito de nÃºmeros Ã© obrigatÃ³rio")
    private Boolean passwordRequireNumbers;
    
    @NotNull(message = "Requisito de sÃ­mbolos Ã© obrigatÃ³rio")
    private Boolean passwordRequireSymbols;
    
    // Bloqueio de conta
    @NotNull(message = "Bloqueio de conta Ã© obrigatÃ³rio")
    private Boolean accountLockoutEnabled;
    
    @Min(value = 1, message = "Tentativas mÃ¡ximas deve ser maior que 0")
    private Integer maxFailedAttempts;
    
    @Min(value = 1, message = "DuraÃ§Ã£o do bloqueio deve ser maior que 0")
    private Integer lockoutDurationMinutes;
    
    // ConfiguraÃ§Ãµes gerais
    @Min(value = 5, message = "Timeout da sessÃ£o deve ser pelo menos 5 minutos")
    private Integer sessionTimeoutMinutes;
    
    @NotNull(message = "Whitelist de IP Ã© obrigatÃ³ria")
    private Boolean ipWhitelistEnabled;
    
    private List<String> ipWhitelist;
    
    @NotNull(message = "Log de auditoria Ã© obrigatÃ³rio")
    private Boolean auditLogEnabled;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

