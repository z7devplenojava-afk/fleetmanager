package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.UserTermsConsent;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateUserTermsConsentDTO {
    
    @NotNull(message = "User ID Ã© obrigatÃ³rio")
    private UUID userId;
    
    @NotNull(message = "Tipo de usuÃ¡rio Ã© obrigatÃ³rio")
    private UserTermsConsent.UserType userType;
    
    @NotNull(message = "CPF do usuÃ¡rio Ã© obrigatÃ³rio")
    private String userCpf;
    
    @NotNull(message = "AceitaÃ§Ã£o Ã© obrigatÃ³ria")
    private Boolean accepted;
    
    private String ipAddress;
    
    private String userAgent;
    
    private String termsVersion;
    
    private String privacyPolicyVersion;
    
    private String termsContentHash;
}

