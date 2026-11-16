package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.GeneratedContract;
import com.z7design.fleet_manager.repository.GeneratedContractRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Serviço de Segurança Documental e Presigned URLs (Skill: dual-tier-contract-generator)
 * - Gera URLs temporárias assinadas com validade de 300 segundos (5 minutos)
 * - Calcula hash SHA-256 para garantia de imutabilidade e validade jurídica
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ContractPresignedUrlService {

    private final GeneratedContractRepository generatedContractRepository;

    @Value("${fluxbus.contracts.presigned-secret:fluxbus_contract_vault_key_2026}")
    private String signingSecret;

    private static final long URL_VALIDITY_SECONDS = 300; // 5 minutos

    /**
     * Calcula o hash SHA-256 imutável do PDF
     */
    public String calculateSha256(byte[] content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content);
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            log.error("Erro ao calcular SHA-256 do documento: {}", e.getMessage());
            throw new RuntimeException("Falha ao gerar hash de integridade do contrato", e);
        }
    }

    /**
     * Gera Presigned URL temporária para visualização e download
     */
    public String generatePresignedUrl(UUID contractId, UUID userId, String baseUrl) {
        long expiresAt = (System.currentTimeMillis() / 1000) + URL_VALIDITY_SECONDS;
        String payload = contractId + ":" + (userId != null ? userId : "anon") + ":" + expiresAt;
        String signature = sign(payload);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString((payload + ":" + signature).getBytes(StandardCharsets.UTF_8));

        return baseUrl + "/api/contract-documents/" + contractId + "/download?token=" + token;
    }

    /**
     * Valida o token temporário da Presigned URL
     */
    public boolean validatePresignedToken(UUID contractId, String token) {
        try {
            if (token == null || token.isBlank()) return false;
            byte[] decodedBytes = Base64.getUrlDecoder().decode(token);
            String decoded = new String(decodedBytes, StandardCharsets.UTF_8);
            String[] parts = decoded.split(":");
            if (parts.length != 4) return false;

            UUID tokenContractId = UUID.fromString(parts[0]);
            long expiresAt = Long.parseLong(parts[2]);
            String expectedSignature = parts[3];

            if (!contractId.equals(tokenContractId)) return false;

            // Checar expiração (300 segundos)
            long nowSeconds = System.currentTimeMillis() / 1000;
            if (nowSeconds > expiresAt) {
                log.warn("⚠️ Presigned URL para o contrato {} expirou em {}", contractId, expiresAt);
                return false;
            }

            // Validar assinatura HMAC
            String payload = parts[0] + ":" + parts[1] + ":" + parts[2];
            String computedSignature = sign(payload);
            return computedSignature.equals(expectedSignature);
        } catch (Exception e) {
            log.warn("Falha na validação do token do contrato {}: {}", contractId, e.getMessage());
            return false;
        }
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(signingSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(rawHmac);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao assinar URL de contrato", e);
        }
    }
}
