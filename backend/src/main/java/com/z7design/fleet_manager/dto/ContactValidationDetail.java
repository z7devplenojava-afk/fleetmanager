package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.AccessLevel;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Detalhe de validaÃ§Ã£o de contato para um funcionÃ¡rio especÃ­fico
 */
@Data
@Builder
@Setter(AccessLevel.PUBLIC)
@NoArgsConstructor
@AllArgsConstructor
public class ContactValidationDetail {
    
    // Dados do Employee
    private UUID employeeId;
    private String employeeName;
    private String employeeCpf;
    private String employeeEmail;
    private String employeePhone;
    
    // Dados do User (se existir)
    private boolean hasUser;
    private UUID userId;
    private String userEmail;
    private String userWhatsapp;
    private boolean hasWhatsAppConsent;
    private boolean needsWhatsAppConsent;
    private LocalDateTime whatsappConsentDate;
    
    // Status de validaÃ§Ã£o
    private boolean canSendEmail;
    private boolean canSendWhatsApp;
    private boolean needsUserCreation;
    private boolean needsWhatsAppUpdate;
    private boolean needsEmailUpdate;
    
    // Mensagens de erro/aviso
    private String emailError;
    private String whatsappError;
    private String generalError;
    
    // Status geral
    private String status; // "ready", "needs_action", "error"
    private String statusMessage;
}


