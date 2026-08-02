package com.z7design.fleet_manager.converter;

import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Teste do EmailCryptoConverter: a criptografia AES das credenciais de
 * e-mail aplicada no campo password do EmailAccount (anotado com
 * {@code @Convert(converter = EmailCryptoConverter.class)}) no momento da
 * persistência. Valida que o valor gravado não é texto puro, que é Base64
 * decodificável e que o round-trip (decrypt) recupera a senha original.
 */
class EmailCryptoConverterTest {

    private final EmailCryptoConverter converter = new EmailCryptoConverter();

    @Test
    void encrypt_ShouldNotStorePlaintext() {
        String encrypted = converter.convertToDatabaseColumn("senha-super-secreta");

        assertNotNull(encrypted);
        assertNotEquals("senha-super-secreta", encrypted);
        // Deve ser Base64 válido e decodificar para bytes criptografados
        assertDoesNotThrow(() -> Base64.getDecoder().decode(encrypted));
    }

    @Test
    void decrypt_ShouldRoundTrip_OriginalPassword() {
        String password = "Senha@Forte#2026";
        String encrypted = converter.convertToDatabaseColumn(password);

        String decrypted = converter.convertToEntityAttribute(encrypted);

        assertEquals(password, decrypted);
    }

    @Test
    void nullValues_ShouldPassThrough() {
        assertNull(converter.convertToDatabaseColumn(null));
        assertNull(converter.convertToEntityAttribute(null));
    }
}
