package com.z7design.fleet_manager.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Component
@Converter(autoApply = false)
public class EmailCryptoConverter implements AttributeConverter<String, String> {

    private static final String ALGORITHM = "AES";

    // In production, this should come from environment variables or a vault.
    // Making it static/configurable for now.
    private static final String SECRET_KEY = "FleetManagerEmailSecretKey2026!!"; // Must be 16, 24, or 32 chars for AES

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            SecretKeySpec key = new SecretKeySpec(SECRET_KEY.getBytes(StandardCharsets.UTF_8), ALGORITHM);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, key);
            byte[] encrypted = cipher.doFinal(attribute.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            throw new RuntimeException("Error encrypting email password", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            SecretKeySpec key = new SecretKeySpec(SECRET_KEY.getBytes(StandardCharsets.UTF_8), ALGORITHM);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, key);
            byte[] original = cipher.doFinal(Base64.getDecoder().decode(dbData));
            return new String(original, StandardCharsets.UTF_8);
        } catch (Exception e) {
            // Log error but don't crash application startup if decryption fails for old
            // data
            // In a real app, this should be handled more gracefully
            throw new RuntimeException("Error decrypting email password", e);
        }
    }
}
