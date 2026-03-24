package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.*;
import com.z7design.fleet_manager.model.UserTermsConsent;
import com.z7design.fleet_manager.repository.UserTermsConsentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserTermsConsentService {
    
    private final UserTermsConsentRepository consentRepository;
    
    // VersÃµes atuais dos termos (configurÃ¡veis)
    private static final String CURRENT_TERMS_VERSION = "1.0.0";
    private static final String CURRENT_PRIVACY_POLICY_VERSION = "1.0.0";
    
    @Transactional(readOnly = true)
    public boolean hasUserAcceptedTerms(UUID userId, UserTermsConsent.UserType userType) {
        Optional<UserTermsConsent> consent = consentRepository.findAcceptedConsentByUser(userId, userType);
        return consent.isPresent();
    }
    
    @Transactional(readOnly = true)
    public boolean hasUserAcceptedTermsByCpf(String cpf, UserTermsConsent.UserType userType) {
        Optional<UserTermsConsent> consent = consentRepository.findAcceptedConsentByCpf(cpf, userType);
        return consent.isPresent();
    }
    
    @Transactional(readOnly = true)
    public UserTermsConsentDTO getLatestConsent(UUID userId, UserTermsConsent.UserType userType) {
        List<UserTermsConsent> consents = consentRepository.findByUserOrderByCreatedAtDesc(userId, userType);
        if (consents.isEmpty()) {
            return null;
        }
        return UserTermsConsentDTO.fromEntity(consents.get(0));
    }
    
    @Transactional(readOnly = true)
    public UserTermsConsentDTO getLatestConsentByCpf(String cpf, UserTermsConsent.UserType userType) {
        List<UserTermsConsent> consents = consentRepository.findByCpfOrderByCreatedAtDesc(cpf, userType);
        if (consents.isEmpty()) {
            return null;
        }
        return UserTermsConsentDTO.fromEntity(consents.get(0));
    }
    
    @Transactional
    public UserTermsConsentDTO createConsent(CreateUserTermsConsentDTO createDTO) {
        log.info("Criando consentimento para usuÃ¡rio: {} ({})", createDTO.getUserId(), createDTO.getUserType());
        
        UserTermsConsent consent = new UserTermsConsent();
        consent.setUserId(createDTO.getUserId());
        consent.setUserType(createDTO.getUserType());
        consent.setUserCpf(createDTO.getUserCpf());
        consent.setAccepted(createDTO.getAccepted());
        consent.setAcceptedAt(createDTO.getAccepted() ? LocalDateTime.now() : null);
        consent.setIpAddress(createDTO.getIpAddress());
        consent.setUserAgent(createDTO.getUserAgent());
        consent.setTermsVersion(createDTO.getTermsVersion() != null ? createDTO.getTermsVersion() : CURRENT_TERMS_VERSION);
        consent.setPrivacyPolicyVersion(createDTO.getPrivacyPolicyVersion() != null ? createDTO.getPrivacyPolicyVersion() : CURRENT_PRIVACY_POLICY_VERSION);
        consent.setTermsContentHash(createDTO.getTermsContentHash() != null ? createDTO.getTermsContentHash() : generateTermsHash());
        
        UserTermsConsent savedConsent = consentRepository.save(consent);
        log.info("Consentimento criado com sucesso: ID {}", savedConsent.getId());
        
        return UserTermsConsentDTO.fromEntity(savedConsent);
    }
    
    @Transactional(readOnly = true)
    public Page<UserTermsConsentDTO> getAllConsents(Pageable pageable) {
        return consentRepository.findAll(pageable)
                .map(UserTermsConsentDTO::fromEntity);
    }
    
    @Transactional(readOnly = true)
    public List<UserTermsConsentDTO> getAllAcceptedConsents() {
        return consentRepository.findAllAcceptedConsentsOrderByAcceptedAtDesc()
                .stream()
                .map(UserTermsConsentDTO::fromEntity)
                .toList();
    }
    
    @Transactional(readOnly = true)
    public List<UserTermsConsentDTO> getConsentsByUserType(UserTermsConsent.UserType userType) {
        return consentRepository.findByUserTypeOrderByCreatedAtDesc(userType)
                .stream()
                .map(UserTermsConsentDTO::fromEntity)
                .toList();
    }
    
    @Transactional(readOnly = true)
    public long countAcceptedConsents(UserTermsConsent.UserType userType) {
        return consentRepository.countAcceptedConsents(userType);
    }
    
    @Transactional(readOnly = true)
    public boolean isConsentRequired(UUID userId, UserTermsConsent.UserType userType) {
        return !hasUserAcceptedTerms(userId, userType);
    }
    
    @Transactional(readOnly = true)
    public boolean isConsentRequiredByCpf(String cpf, UserTermsConsent.UserType userType) {
        return !hasUserAcceptedTermsByCpf(cpf, userType);
    }
    
    @Transactional(readOnly = true)
    public String getCurrentTermsVersion() {
        return CURRENT_TERMS_VERSION;
    }
    
    @Transactional(readOnly = true)
    public String getCurrentPrivacyPolicyVersion() {
        return CURRENT_PRIVACY_POLICY_VERSION;
    }
    
    @Transactional(readOnly = true)
    public String getTermsContentHash() {
        return generateTermsHash();
    }
    
    private String generateTermsHash() {
        try {
            String content = "TERMS_CONTENT_" + CURRENT_TERMS_VERSION + "_" + System.currentTimeMillis();
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(content.getBytes());
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            log.error("Erro ao gerar hash dos termos", e);
            return "DEFAULT_HASH_" + System.currentTimeMillis();
        }
    }
}

