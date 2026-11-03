package com.z7design.fleet_manager.security;

import com.z7design.fleet_manager.model.kiosk.KioskDevice;
import com.z7design.fleet_manager.model.kiosk.KioskDeviceCredential;
import com.z7design.fleet_manager.repository.kiosk.KioskDeviceCredentialRepository;
import com.z7design.fleet_manager.repository.kiosk.KioskDeviceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class KioskDeviceTokenService {

    private final KioskDeviceCredentialRepository credentialRepository;
    private final KioskDeviceRepository deviceRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Gera um token de dispositivo criptograficamente seguro e persiste o hash no banco.
     */
    @Transactional
    public String createCredential(UUID deviceId) {
        // Remover credencial anterior se houver
        credentialRepository.findByDeviceId(deviceId).ifPresent(old -> {
            old.setStatus("REVOKED");
            old.setRevokedAt(LocalDateTime.now());
            credentialRepository.save(old);
        });

        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String rawToken = "kiosk_" + Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        byte[] saltBytes = new byte[16];
        secureRandom.nextBytes(saltBytes);
        String salt = Base64.getUrlEncoder().withoutPadding().encodeToString(saltBytes);

        String tokenHash = hashToken(rawToken, salt);

        KioskDeviceCredential credential = KioskDeviceCredential.builder()
                .deviceId(deviceId)
                .tokenHash(tokenHash)
                .salt(salt)
                .status("ACTIVE")
                .expiresAt(LocalDateTime.now().plusYears(5)) // Longa duração com revogação explícita
                .build();

        credentialRepository.save(credential);
        log.info("🔑 Nova credencial gerada para o totem deviceId: {}", deviceId);

        return rawToken;
    }

    /**
     * Valida um token bruto contra a credencial armazenada e retorna o Totem autenticado.
     */
    @Transactional(readOnly = true)
    public Optional<KioskDevice> authenticate(String rawToken) {
        if (rawToken == null || !rawToken.startsWith("kiosk_")) {
            return Optional.empty();
        }

        // Busca todas as credenciais ativas e compara hashes
        // O número de totens por tenant é reduzido, mas fazemos busca segura
        for (KioskDeviceCredential cred : credentialRepository.findAll()) {
            if ("ACTIVE".equalsIgnoreCase(cred.getStatus())) {
                String candidateHash = hashToken(rawToken, cred.getSalt());
                if (candidateHash.equals(cred.getTokenHash())) {
                    if (cred.getExpiresAt() != null && cred.getExpiresAt().isBefore(LocalDateTime.now())) {
                        log.warn("⚠️ Credencial de totem expirada para deviceId: {}", cred.getDeviceId());
                        return Optional.empty();
                    }
                    return deviceRepository.findById(cred.getDeviceId())
                            .filter(d -> !"REVOKED".equalsIgnoreCase(d.getStatus()));
                }
            }
        }

        return Optional.empty();
    }

    @Transactional
    public void revoke(UUID deviceId) {
        credentialRepository.findByDeviceId(deviceId).ifPresent(cred -> {
            cred.setStatus("REVOKED");
            cred.setRevokedAt(LocalDateTime.now());
            credentialRepository.save(cred);
            log.info("🚫 Credencial do totem {} revogada com sucesso", deviceId);
        });
    }

    private String hashToken(String rawToken, String salt) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            if (salt != null) {
                digest.update(salt.getBytes(StandardCharsets.UTF_8));
            }
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Algoritmo SHA-256 não disponível no runtime", e);
        }
    }
}
