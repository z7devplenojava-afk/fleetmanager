package com.z7design.fleet_manager.security;

import com.z7design.fleet_manager.config.JwtConfig;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.UserCompanyResolver;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Service
public class JwtService {
    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    private final JwtConfig jwtConfig;
    private final UserCompanyResolver userCompanyResolver;

    public JwtService(JwtConfig jwtConfig, UserCompanyResolver userCompanyResolver) {
        this.jwtConfig = jwtConfig;
        this.userCompanyResolver = userCompanyResolver;
        if (jwtConfig.getSecret() == null || jwtConfig.getSecret().trim().isEmpty()) {
            throw new IllegalStateException("JWT secret não está configurado");
        }
        log.info("JwtService initialized with expiration: {} ms", jwtConfig.getExpiration());
    }

    public static final String CLAIM_EMPRESA_ID = "empresaId";
    public static final String CLAIM_USER_ID = "userId";
    public static final String CLAIM_ROLE = "role";

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

    public UUID extractEmpresaId(String token) {
        try {
            Object claim = extractClaim(token, c -> c.get(CLAIM_EMPRESA_ID));
            if (claim == null) return null;
            if (claim instanceof String) return UUID.fromString((String) claim);
            return null;
        } catch (Exception e) {
            log.debug("EmpresaId não presente no token: {}", e.getMessage());
            return null;
        }
    }

    public UUID extractUserId(String token) {
        try {
            Object claim = extractClaim(token, c -> c.get(CLAIM_USER_ID));
            if (claim == null) return null;
            if (claim instanceof String) return UUID.fromString((String) claim);
            return null;
        } catch (Exception e) {
            log.debug("UserId não presente no token: {}", e.getMessage());
            return null;
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

    public String generateToken(String subject) {
        return generateToken(new HashMap<>(), subject, jwtConfig.getExpiration());
    }

    public String generateToken(String subject, String role) {
        Map<String, Object> claims = new HashMap<>();
        if (role != null) {
            claims.put("role", role);
        }
        return generateToken(claims, subject, jwtConfig.getExpiration());
    }

    public String generateRefreshToken(User user) {
        return generateToken(new HashMap<>(), user, jwtConfig.getRefreshTokenExpiration());
    }

    public String generateToken(
            Map<String, Object> extraClaims,
            User user,
            long expirationTime) {
        try {
            Date now = new Date();
            Date expiryDate = new Date(now.getTime() + expirationTime);

            Map<String, Object> claims = new HashMap<>(extraClaims);
            claims.put(CLAIM_USER_ID, user.getId() != null ? user.getId().toString() : null);
            Company company = userCompanyResolver.resolveCompany(user).orElse(null);
            if (company != null && company.getId() != null) {
                claims.put(CLAIM_EMPRESA_ID, company.getId().toString());
            }
            if (user.getRoles() != null && !user.getRoles().isEmpty()) {
                String firstRole = user.getRoles().iterator().next().getName();
                claims.put(CLAIM_ROLE, firstRole);
            }

            log.info("Gerando token para usuário: {}, expira em: {} ({} ms)", user.getUsername(), expiryDate,
                    expirationTime);

            String token = Jwts.builder()
                    .setClaims(claims)
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

    private String generateToken(
            Map<String, Object> extraClaims,
            String subject,
            long expirationTime) {
        try {
            Date now = new Date();
            Date expiryDate = new Date(now.getTime() + expirationTime);

            log.info("Gerando token para subject: {}, expira em: {} ({} ms)", subject, expiryDate, expirationTime);

            String token = Jwts.builder()
                    .setClaims(extraClaims)
                    .setSubject(subject)
                    .setIssuedAt(now)
                    .setExpiration(expiryDate)
                    .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                    .compact();

            log.info("Token gerado com sucesso para subject: {}", subject);
            return token;
        } catch (Exception e) {
            log.error("Erro ao gerar token (subject): {}", e.getMessage());
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
                log.error("❌ Chave secreta JWT não está configurada (null ou vazia)");
                throw new IllegalStateException("Chave secreta JWT não está configurada");
            }
            String secret = jwtConfig.getSecret().trim();
            byte[] keyBytes = secret.getBytes(java.nio.charset.StandardCharsets.UTF_8);

            log.info("🔑 Configurando chave JWT: tamanho = {} bytes", keyBytes.length);

            // HS512 requer pelo menos 64 bytes (512 bits) - aplica SHA-512 key stretching se menor
            if (keyBytes.length < 64) {
                log.info("🔑 Chave JWT menor que 64 bytes ({} bytes). Aplicando SHA-512 key stretching para HS512.", keyBytes.length);
                try {
                    java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-512");
                    keyBytes = md.digest(keyBytes);
                } catch (Exception e) {
                    byte[] padded = new byte[64];
                    System.arraycopy(keyBytes, 0, padded, 0, Math.min(keyBytes.length, 64));
                    keyBytes = padded;
                }
            }

            log.debug("✅ Criando chave de assinatura JWT com {} bytes", keyBytes.length);
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (IllegalStateException e) {
            log.error("❌ Erro de configuração na chave de assinatura: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("❌ Erro ao criar chave de assinatura: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao criar chave de assinatura: " + e.getMessage(), e);
        }
    }
}
