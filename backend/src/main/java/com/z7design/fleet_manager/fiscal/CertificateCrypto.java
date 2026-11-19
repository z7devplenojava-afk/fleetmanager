package com.z7design.fleet_manager.fiscal;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Criptografia simétrica (AES-256-GCM) do material do certificado A1.
 * A chave é configurada em {@code fiscal.certificate.encryption-key}.
 */
@Component
@Slf4j
public class CertificateCrypto {

    private static final int IV_LENGTH = 12;
    private static final int TAG_BITS = 128;
    private static final String DEV_FALLBACK = "fleetmanager-dev-only-certificate-key-change-me";

    private final SecretKeySpec key;
    private final SecureRandom random = new SecureRandom();

    public CertificateCrypto(@Value("${fiscal.certificate.encryption-key:}") String configuredKey) {
        String material = configuredKey == null ? "" : configuredKey.trim();
        SecretKeySpec resolved;
        if (material.isEmpty()) {
            log.warn("fiscal.certificate.encryption-key não configurada. Usando chave de desenvolvimento; "
                    + "configure a variável FISCAL_CERTIFICATE_ENCRYPTION_KEY em produção.");
            resolved = new SecretKeySpec(sha256(DEV_FALLBACK), "AES");
        } else {
            resolved = null;
            try {
                byte[] decoded = Base64.getDecoder().decode(material);
                if (decoded.length == 32) {
                    resolved = new SecretKeySpec(decoded, "AES");
                }
            } catch (IllegalArgumentException ignored) {
                // Não é Base64: será derivada via SHA-256.
            }
            if (resolved == null) {
                resolved = new SecretKeySpec(sha256(material), "AES");
            }
        }
        this.key = resolved;
    }

    public Encrypted encrypt(byte[] plain) {
        try {
            byte[] iv = new byte[IV_LENGTH];
            random.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
            return new Encrypted(cipher.doFinal(plain), iv);
        } catch (Exception e) {
            throw new IllegalStateException("Não foi possível criptografar o material do certificado.", e);
        }
    }

    public byte[] decrypt(byte[] cipherText, byte[] iv) {
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
            return cipher.doFinal(cipherText);
        } catch (Exception e) {
            throw new IllegalStateException("Não foi possível descriptografar o material do certificado. "
                    + "Verifique a chave fiscal.certificate.encryption-key.", e);
        }
    }

    private static byte[] sha256(String value) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    public record Encrypted(byte[] cipherText, byte[] iv) {
    }
}
