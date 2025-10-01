package br.com.fleetmanager.security;

import br.com.fleetmanager.config.JwtConfig;
import br.com.fleetmanager.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Slf4j
@Service
public class JwtService {

    private final JwtConfig jwtConfig;

    public JwtService(JwtConfig jwtConfig) {
        this.jwtConfig = jwtConfig;
        if (jwtConfig.getSecret() == null || jwtConfig.getSecret().trim().isEmpty()) {
            throw new IllegalStateException("JWT secret não está configurado");
        }
        log.info("JwtService initialized with expiration: {} ms", jwtConfig.getExpiration());
    }

    public String extractUsername(String token) {
        try {
            String username = extractClaim(token, Claims::getSubject);
            log.debug("Username extraído do token: {}", username);
            return username;
        } catch (Exception e) {
            log.error("Erro ao extrair username do token: {}", e.getMessage());
            throw new RuntimeException("Token JWT inválido: " + e.getMessage());
        }
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        try {
            final Claims claims = extractAllClaims(token);
            T result = claimsResolver.apply(claims);
            log.debug("Claim extraído do token: {}", result);
            return result;
        } catch (Exception e) {
            log.error("Erro ao extrair claim do token: {}", e.getMessage());
            throw new RuntimeException("Erro ao extrair claim do token: " + e.getMessage());
        }
    }

    public String generateToken(User user) {
        return generateToken(new HashMap<>(), user, jwtConfig.getExpiration());
    }

    public String generateToken(Map<String, Object> extraClaims, User user) {
        return generateToken(extraClaims, user, jwtConfig.getExpiration());
    }

    public String generateRefreshToken(User user) {
        return generateToken(new HashMap<>(), user, jwtConfig.getRefreshTokenExpiration());
    }

    public String generateToken(
            Map<String, Object> extraClaims,
            User user,
            long expirationTime
    ) {
        try {
            Date now = new Date();
            Date expiryDate = new Date(now.getTime() + expirationTime);
            
            log.info("Gerando token para usuário: {}, expira em: {} ({} ms)", user.getUsername(), expiryDate, expirationTime);
            
            String token = Jwts.builder()
                    .setClaims(extraClaims)
                    .setSubject(user.getUsername())
                    .setIssuedAt(now)
                    .setExpiration(expiryDate)
                    .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                    .compact();
                    
            log.info("Token gerado com sucesso para usuário: {}", user.getUsername());
            return token;
        } catch (Exception e) {
            log.error("Erro ao gerar token: {}", e.getMessage());
            throw new RuntimeException("Erro ao gerar token: " + e.getMessage());
        }
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            boolean isExpired = isTokenExpired(token);
            boolean isUsernameValid = username.equals(userDetails.getUsername());
            
            log.info("Validação do token para usuário {}: username válido: {}, token expirado: {}", 
                username, isUsernameValid, isExpired);
            
            return isUsernameValid && !isExpired;
        } catch (Exception e) {
            log.error("Erro ao validar token: {}", e.getMessage());
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        Date expiration = extractExpiration(token);
        boolean isExpired = expiration.before(new Date());
        log.info("Verificação de expiração do token: data de expiração: {}, está expirado: {}", 
            expiration, isExpired);
        return isExpired;
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            log.debug("Claims extraídos do token: {}", claims);
            return claims;
        } catch (Exception e) {
            log.error("Erro ao analisar token JWT: {}", e.getMessage());
            throw new RuntimeException("Erro ao analisar token JWT: " + e.getMessage());
        }
    }

    private Key getSigningKey() {
        try {
            if (jwtConfig.getSecret() == null || jwtConfig.getSecret().trim().isEmpty()) {
                throw new IllegalStateException("Chave secreta JWT não está configurada");
            }
            byte[] keyBytes = jwtConfig.getSecret().getBytes();
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (Exception e) {
            log.error("Erro ao criar chave de assinatura: {}", e.getMessage());
            throw new RuntimeException("Erro ao criar chave de assinatura: " + e.getMessage());
        }
    }
} 