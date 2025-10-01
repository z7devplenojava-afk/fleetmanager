package br.com.fleetmanager.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {
    private String secret;
    private Long expiration;
    private Long refreshTokenExpiration;
    private String header;
    private String prefix;

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