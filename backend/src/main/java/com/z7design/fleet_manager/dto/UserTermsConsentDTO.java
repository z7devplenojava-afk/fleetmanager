package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.UserTermsConsent;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class UserTermsConsentDTO {
    private UUID id;
    private UUID userId;
    private UserTermsConsent.UserType userType;
    private String userCpf;
    private Boolean accepted;
    private LocalDateTime acceptedAt;
    private String ipAddress;
    private String userAgent;
    private String termsVersion;
    private String privacyPolicyVersion;
    private String termsContentHash;
    private LocalDateTime createdAt;
    
    public static UserTermsConsentDTO fromEntity(UserTermsConsent consent) {
        UserTermsConsentDTO dto = new UserTermsConsentDTO();
        dto.setId(consent.getId());
        dto.setUserId(consent.getUserId());
        dto.setUserType(consent.getUserType());
        dto.setUserCpf(consent.getUserCpf());
        dto.setAccepted(consent.getAccepted());
        dto.setAcceptedAt(consent.getAcceptedAt());
        dto.setIpAddress(consent.getIpAddress());
        dto.setUserAgent(consent.getUserAgent());
        dto.setTermsVersion(consent.getTermsVersion());
        dto.setPrivacyPolicyVersion(consent.getPrivacyPolicyVersion());
        dto.setTermsContentHash(consent.getTermsContentHash());
        dto.setCreatedAt(consent.getCreatedAt());
        return dto;
    }
}

