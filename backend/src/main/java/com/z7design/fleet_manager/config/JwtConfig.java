package com.z7design.fleet_manager.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.annotation.PostConstruct;

@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {
    private static final Logger log = LoggerFactory.getLogger(JwtConfig.class);

    // SEGURANÇA: Sem default hardcoded. O secret DEVE vir de env var/JWT_SECRET.
    // Se ausente, a aplicação falha na inicialização (fail-fast) em vez de rodar
    // com uma chave conhecida publicamente (permite forjar tokens de qualquer usuário).
    private String secret;
    private Long expiration = 1800000L; // 30 minutos (access token de curta duração para mitigar roubo de JWT)
    private Long refreshTokenExpiration = 604800000L; // 7 dias
    private String header = "Authorization";
    private String prefix = "Bearer";

    @PostConstruct
    public void init() {
        if (secret == null || secret.trim().isEmpty()) {
            log.error("❌ JWT secret não configurado! Defina a variável de ambiente JWT_SECRET (mínimo 64 caracteres aleatórios).");
            throw new IllegalStateException(
                    "JWT secret não configurado. Defina a env var JWT_SECRET (gere com: openssl rand -hex 64).");
        }
        if (secret.trim().length() < 64) {
            log.warn("⚠️ JWT secret com menos de 64 caracteres — recomendado gerar com: openssl rand -hex 64");
        }
        log.info("🔐 JwtConfig inicializado - Secret configurado ({} caracteres), Expiration: {} ms, RefreshExpiration: {} ms",
                secret.trim().length(), expiration, refreshTokenExpiration);
    }

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public Long getExpiration() {
        return expiration;
    }

    public void setExpiration(Long expiration) {
        this.expiration = expiration;
    }

    public Long getRefreshTokenExpiration() {
        return refreshTokenExpiration;
    }

    public void setRefreshTokenExpiration(Long refreshTokenExpiration) {
        this.refreshTokenExpiration = refreshTokenExpiration;
    }

    public String getHeader() {
        return header;
    }

    public void setHeader(String header) {
        this.header = header;
    }

    public String getPrefix() {
        return prefix;
    }

    public void setPrefix(String prefix) {
        this.prefix = prefix;
    }
}
