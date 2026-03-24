package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.UserConsent;
import com.z7design.fleet_manager.model.UserConsent.ConsentType;
import com.z7design.fleet_manager.repository.UserConsentRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LgpdConsentService {

    private final UserConsentRepository consentRepository;
    private final UserRepository userRepository;

    private static final String CURRENT_TERM_VERSION = "1.0";

    /**
     * Registra consentimento do usuÃ¡rio
     */
    public UserConsent registerConsent(
        UUID userId,
        ConsentType consentType,
        String ipAddress,
        String userAgent,
        BigDecimal latitude,
        BigDecimal longitude
    ) {
        log.info("ðŸ“ Registrando consentimento {} para usuÃ¡rio {}", consentType, userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado"));

        UserConsent consent = UserConsent.builder()
                .user(user)
                .consentType(consentType)
                .termVersion(CURRENT_TERM_VERSION)
                .accepted(true)
                .acceptedAt(LocalDateTime.now())
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .latitude(latitude)
                .longitude(longitude)
                .build();

        UserConsent saved = consentRepository.save(consent);
        log.info("âœ… Consentimento {} registrado para usuÃ¡rio {}", consentType, userId);

        return saved;
    }

    /**
     * Verifica se usuÃ¡rio aceitou todos os termos obrigatÃ³rios
     */
    public boolean hasAcceptedAllRequiredConsents(UUID userId) {
        return consentRepository.hasAcceptedAllRequiredConsents(userId);
    }

    /**
     * Busca todos os consentimentos de um usuÃ¡rio
     */
    public List<UserConsent> getUserConsents(UUID userId) {
        return consentRepository.findByUserId(userId);
    }

    /**
     * Busca consentimentos ativos (nÃ£o revogados)
     */
    public List<UserConsent> getActiveConsents(UUID userId) {
        return consentRepository.findActiveConsentsByUserId(userId);
    }

    /**
     * Revoga um consentimento
     */
    public void revokeConsent(UUID consentId, String reason) {
        UserConsent consent = consentRepository.findById(consentId)
                .orElseThrow(() -> new RuntimeException("Consentimento nÃ£o encontrado"));

        consent.setRevoked(true);
        consent.setRevokedAt(LocalDateTime.now());
        consent.setRevokedReason(reason);

        consentRepository.save(consent);
        log.info("ðŸš« Consentimento {} revogado para usuÃ¡rio {}", consentId, consent.getUser().getId());
    }

    /**
     * Verifica se usuÃ¡rio precisa aceitar novos termos (nova versÃ£o)
     */
    public boolean needsToAcceptNewTerms(UUID userId) {
        // Verifica se existe consentimento da versÃ£o atual
        for (ConsentType type : ConsentType.values()) {
            var consent = consentRepository.findByUserIdAndConsentTypeAndTermVersion(
                    userId, type, CURRENT_TERM_VERSION);
            if (consent.isEmpty() || !consent.get().getAccepted()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Marca primeiro acesso como completo
     */
    public void markFirstAccessCompleted(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado"));
        user.setFirstAccessCompleted(true);
        userRepository.save(user);
        log.info("âœ… Primeiro acesso completado para usuÃ¡rio {}", userId);
    }

    /**
     * Verifica se usuÃ¡rio completou primeiro acesso
     */
    public boolean hasCompletedFirstAccess(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado"));
        return user.getFirstAccessCompleted() != null && user.getFirstAccessCompleted();
    }
}


