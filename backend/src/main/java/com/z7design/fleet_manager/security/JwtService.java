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
            throw new IllegalStateException("JWT secret nÃ£o estÃ¡ configurado");
        }
        log.info("JwtService initialized with expiration: {} ms", jwtConfig.getExpiration());
    }

    public static final String CLAIM_EMPRESA_ID = "empresaId";
    public static final String CLAIM_USER_ID = "userId";
    public static final String CLAIM_ROLE = "role";

    public String extractUsername(String token) {
        try {
            String username = extractClaim(token, Claims::getSubject);
            log.debug("Username extraÃ­do do token: {}", username);
            return username;
        } catch (Exception e) {
            log.error("Erro ao extrair username do token: {}", e.getMessage());
            throw new RuntimeException("Token JWT invÃ¡lido: " + e.getMessage());
        }
    }

    public UUID extractEmpresaId(String token) {
        try {
            Object claim = extractClaim(token, c -> c.get(CLAIM_EMPRESA_ID));
            if (claim == null) return null;
            if (claim instanceof String) return UUID.fromString((String) claim);
            return null;
        } catch (Exception e) {
            log.debug("EmpresaId nÃ£o presente no token: {}", e.getMessage());
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
            log.debug("UserId nÃ£o presente no token: {}", e.getMessage());
            return null;
        }
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        try {
            final Claims claims = extractAllClaims(token);
            T result = claimsResolver.apply(claims);
            log.debug("Claim extraÃ­do do token: {}", result);
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

    // Overloads to support generating tokens without a User entity (e.g.,
    // supervisors)
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

            log.info("Gerando token para usuÃ¡rio: {}, expira em: {} ({} ms)", user.getUsername(), expiryDate,
                    expirationTime);

            String token = Jwts.builder()
                    .setClaims(claims)
                    .setSubject(user.getUsername())
                    .setIssuedAt(now)
                    .setExpiration(expiryDate)
                    .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                    .compact();

            log.info("Token gerado com sucesso para usuÃ¡rio: {}", user.getUsername());
            return token;
        } catch (Exception e) {
            log.error("Erro ao gerar token: {}", e.getMessage());
            throw new RuntimeException("Erro ao gerar token: " + e.getMessage());
        }
    }

    // Internal generator allowing raw subject (no User object)
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

            log.info("ValidaÃ§Ã£o do token para usuÃ¡rio {}: username vÃ¡lido: {}, token expirado: {}",
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
        log.info("VerificaÃ§Ã£o de expiraÃ§Ã£o do token: data de expiraÃ§Ã£o: {}, estÃ¡ expirado: {}",
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
            log.debug("Claims extraÃ­dos do token: {}", claims);
            return claims;
        } catch (Exception e) {
            log.error("Erro ao analisar token JWT: {}", e.getMessage());
            throw new RuntimeException("Erro ao analisar token JWT: " + e.getMessage());
        }
    }

    private Key getSigningKey() {
        try {
            if (jwtConfig.getSecret() == null || jwtConfig.getSecret().trim().isEmpty()) {
                log.error("âŒ Chave secreta JWT nÃ£o estÃ¡ configurada (null ou vazia)");
                throw new IllegalStateException("Chave secreta JWT nÃ£o estÃ¡ configurada");
            }
            String secret = jwtConfig.getSecret().trim();
            byte[] keyBytes = secret.getBytes();

            // Log do tamanho da chave (sem mostrar o valor completo por seguranÃ§a)
            log.info("ðŸ”‘ Configurando chave JWT: tamanho = {} bytes (primeiros 10 caracteres: {}...)",
                    keyBytes.length, secret.substring(0, Math.min(10, secret.length())));

            // HS512 requires at least 64 bytes (512 bits)
            if (keyBytes.length < 64) {
                log.error("âŒ Chave JWT muito curta: {} bytes. HS512 requer pelo menos 64 bytes (512 bits).",
                        keyBytes.length);
                log.error("âŒ Valor da chave (primeiros 20 caracteres): {}",
                        secret.substring(0, Math.min(20, secret.length())));
                log.error(
                        "âŒ Por favor, verifique a variÃ¡vel de ambiente JWT_SECRET no docker-compose.ci.yml ou no host");
                throw new IllegalStateException(
                        String.format("Chave JWT muito curta: %d bytes. HS512 requer pelo menos 64 bytes (512 bits). " +
                                "Por favor, configure uma chave com pelo menos 64 caracteres ASCII. " +
                                "Verifique a variÃ¡vel de ambiente JWT_SECRET.", keyBytes.length));
            }

            log.debug("âœ… Criando chave de assinatura JWT com {} bytes", keyBytes.length);
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (IllegalStateException e) {
            log.error("âŒ Erro de configuraÃ§Ã£o na chave de assinatura: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("âŒ Erro ao criar chave de assinatura: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao criar chave de assinatura: " + e.getMessage(), e);
        }
    }
}
