package com.z7design.fleet_manager.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.annotation.PostConstruct;

@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {
    private static final Logger log = LoggerFactory.getLogger(JwtConfig.class);
    private String secret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970"; // Valor padrÃ£o como
                                                                                                // fallback
    private Long expiration = 604800000L; // 7 dias
    private Long refreshTokenExpiration = 604800000L; // 7 dias
    private String header = "Authorization";
    private String prefix = "Bearer";

    @PostConstruct
    public void init() {
        log.info("ðŸ” JwtConfig inicializado - Secret presente: {}, Expiration: {}, RefreshExpiration: {}",
                secret != null && !secret.trim().isEmpty(), expiration, refreshTokenExpiration);
        if (secret == null || secret.trim().isEmpty()) {
            log.error("âŒ JWT secret estÃ¡ null ou vazio!");
        } else {
            log.info("âœ… JWT secret configurado (tamanho: {} caracteres)", secret.length());
        }
    }

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        // SÃ³ substitui se o valor fornecido nÃ£o for null ou vazio
        if (secret != null && !secret.trim().isEmpty()) {
            this.secret = secret;
        }
        // Caso contrÃ¡rio, mantÃ©m o valor padrÃ£o
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
