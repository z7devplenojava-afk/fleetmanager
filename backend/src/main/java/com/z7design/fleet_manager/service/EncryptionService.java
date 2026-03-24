package com.z7design.fleet_manager.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@Service
@Slf4j
public class EncryptionService {
    
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 16;
    private static final int KEY_LENGTH = 256;
    
    @Value("${app.encryption.key:default-encryption-key-for-development}")
    private String encryptionKey;
    
    private final SecureRandom secureRandom = new SecureRandom();
    
    /**
     * Criptografa um embedding facial
     */
    public String encryptEmbedding(String embedding) {
        try {
            // Gerar chave secreta
            SecretKey secretKey = generateSecretKey();
            
            // Gerar IV (Initialization Vector)
            byte[] iv = new byte[GCM_IV_LENGTH];
            secureRandom.nextBytes(iv);
            
            // Configurar cipher
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, gcmSpec);
            
            // Criptografar embedding
            byte[] encryptedBytes = cipher.doFinal(embedding.getBytes(StandardCharsets.UTF_8));
            
            // Combinar IV + dados criptografados
            byte[] combined = new byte[iv.length + encryptedBytes.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(encryptedBytes, 0, combined, iv.length, encryptedBytes.length);
            
            // Retornar em Base64
            return Base64.getEncoder().encodeToString(combined);
            
        } catch (Exception e) {
            log.error("Erro ao criptografar embedding facial", e);
            throw new RuntimeException("Falha na criptografia do embedding", e);
        }
    }
    
    /**
     * Descriptografa um embedding facial
     */
    public String decryptEmbedding(String encryptedEmbedding) {
        try {
            // Decodificar Base64
            byte[] combined = Base64.getDecoder().decode(encryptedEmbedding);
            
            // Separar IV e dados criptografados
            byte[] iv = new byte[GCM_IV_LENGTH];
            byte[] encryptedBytes = new byte[combined.length - GCM_IV_LENGTH];
            
            System.arraycopy(combined, 0, iv, 0, GCM_IV_LENGTH);
            System.arraycopy(combined, GCM_IV_LENGTH, encryptedBytes, 0, encryptedBytes.length);
            
            // Gerar chave secreta
            SecretKey secretKey = generateSecretKey();
            
            // Configurar cipher
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, gcmSpec);
            
            // Descriptografar embedding
            byte[] decryptedBytes = cipher.doFinal(encryptedBytes);
            
            return new String(decryptedBytes, StandardCharsets.UTF_8);
            
        } catch (Exception e) {
            log.error("Erro ao descriptografar embedding facial", e);
            throw new RuntimeException("Falha na descriptografia do embedding", e);
        }
    }
    
    /**
     * Gera hash SHA-256 para verificaÃ§Ã£o de integridade
     */
    public String generateHash(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            log.error("Erro ao gerar hash", e);
            throw new RuntimeException("Falha na geraÃ§Ã£o do hash", e);
        }
    }
    
    /**
     * Verifica integridade do embedding
     */
    public boolean verifyIntegrity(String originalData, String hash) {
        String calculatedHash = generateHash(originalData);
        return calculatedHash.equals(hash);
    }
    
    /**
     * Gera chave secreta AES-256
     */
    private SecretKey generateSecretKey() throws Exception {
        // Em produÃ§Ã£o, usar uma chave fixa armazenada de forma segura
        // Por enquanto, gerar baseada na chave de configuraÃ§Ã£o
        byte[] keyBytes = encryptionKey.getBytes(StandardCharsets.UTF_8);
        
        // Garantir que a chave tenha 256 bits (32 bytes)
        byte[] normalizedKey = new byte[32];
        System.arraycopy(keyBytes, 0, normalizedKey, 0, Math.min(keyBytes.length, 32));
        
        // Se a chave for menor que 32 bytes, preencher com zeros
        if (keyBytes.length < 32) {
            for (int i = keyBytes.length; i < 32; i++) {
                normalizedKey[i] = 0;
            }
        }
        
        return new SecretKeySpec(normalizedKey, "AES");
    }
    
    /**
     * Gera chave aleatÃ³ria para desenvolvimento
     */
    public String generateRandomKey() {
        try {
            KeyGenerator keyGen = KeyGenerator.getInstance("AES");
            keyGen.init(KEY_LENGTH);
            SecretKey secretKey = keyGen.generateKey();
            return Base64.getEncoder().encodeToString(secretKey.getEncoded());
        } catch (Exception e) {
            log.error("Erro ao gerar chave aleatÃ³ria", e);
            throw new RuntimeException("Falha na geraÃ§Ã£o da chave", e);
        }
    }
}

