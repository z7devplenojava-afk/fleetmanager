package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WhatsAppConsentResponse {
    
    private UUID userId;
    private String username;
    private String name;
    private String whatsappNumber;
    private Boolean hasConsent;
    private LocalDateTime consentDate;
    private String consentIp;
    private String message;
}


