package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.WhatsAppConsentResponse;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsAppConsentService {

    private final UserRepository userRepository;

    @Transactional
    public WhatsAppConsentResponse grantConsent(UUID userId, String whatsappNumber, String ipAddress, String userAgent) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("UsuÃ¡rio nÃ£o encontrado"));

        // Atualizar nÃºmero de WhatsApp se fornecido
        if (whatsappNumber != null && !whatsappNumber.trim().isEmpty()) {
            String normalized = whatsappNumber.replaceAll("[^0-9]", "");
            user.setWhatsapp(normalized);
        }

        // Registrar consentimento
        user.setWhatsappConsent(true);
        user.setWhatsappConsentDate(LocalDateTime.now());
        user.setWhatsappConsentIp(ipAddress);
        user.setWhatsappConsentUserAgent(userAgent);

        userRepository.save(user);

        log.info("âœ… Consentimento WhatsApp CONCEDIDO para user {} ({}) - IP: {}", 
                user.getName(), user.getUsername(), ipAddress);

        return WhatsAppConsentResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .name(user.getName())
                .whatsappNumber(user.getWhatsapp())
                .hasConsent(true)
                .consentDate(user.getWhatsappConsentDate())
                .consentIp(user.getWhatsappConsentIp())
                .message("Consentimento para recebimento de mensagens WhatsApp registrado com sucesso")
                .build();
    }

    @Transactional
    public WhatsAppConsentResponse revokeConsent(UUID userId, String ipAddress, String userAgent) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("UsuÃ¡rio nÃ£o encontrado"));

        // Remover consentimento (mantÃ©m nÃºmero WhatsApp mas bloqueia envio)
        user.setWhatsappConsent(false);
        user.setWhatsappConsentDate(LocalDateTime.now()); // Data da revogaÃ§Ã£o
        user.setWhatsappConsentIp(ipAddress);
        user.setWhatsappConsentUserAgent(userAgent);

        userRepository.save(user);

        log.warn("ðŸš« Consentimento WhatsApp REVOGADO para user {} ({}) - IP: {}", 
                user.getName(), user.getUsername(), ipAddress);

        return WhatsAppConsentResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .name(user.getName())
                .whatsappNumber(user.getWhatsapp())
                .hasConsent(false)
                .consentDate(user.getWhatsappConsentDate())
                .consentIp(user.getWhatsappConsentIp())
                .message("Consentimento revogado com sucesso. VocÃª nÃ£o receberÃ¡ mais mensagens WhatsApp.")
                .build();
    }

    public WhatsAppConsentResponse checkConsentStatus(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("UsuÃ¡rio nÃ£o encontrado"));

        boolean hasConsent = user.getWhatsappConsent() != null && user.getWhatsappConsent();

        return WhatsAppConsentResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .name(user.getName())
                .whatsappNumber(user.getWhatsapp())
                .hasConsent(hasConsent)
                .consentDate(user.getWhatsappConsentDate())
                .consentIp(user.getWhatsappConsentIp())
                .message(hasConsent 
                        ? "Consentimento ativo para receber mensagens WhatsApp" 
                        : "Consentimento nÃ£o concedido ou revogado")
                .build();
    }
}


