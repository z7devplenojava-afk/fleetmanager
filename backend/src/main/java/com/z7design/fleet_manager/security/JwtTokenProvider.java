package com.z7design.fleet_manager.security;

import java.util.Date;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import com.z7design.fleet_manager.config.JwtConfig;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.Role;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private final JwtConfig jwtConfig;

    public String generateToken(User user) {
        try {
            Date now = new Date();
            Date expiryDate = new Date(now.getTime() + jwtConfig.getExpiration());

            log.debug("Gerando token para usuÃ¡rio: {}, expira em: {}", user.getUsername(), expiryDate);

            String token = Jwts.builder()
                    .setSubject(user.getUsername())
                    .claim("roles", user.getRoles().stream().map(Role::getName).collect(Collectors.toList()))
                    .setIssuedAt(now)
                    .setExpiration(expiryDate)
                    .signWith(Keys.hmacShaKeyFor(jwtConfig.getSecret().getBytes()), SignatureAlgorithm.HS512)
                    .compact();

            log.debug("Token gerado com sucesso: {}", token);
            return token;
        } catch (Exception e) {
            log.error("Erro ao gerar token: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar token: " + e.getMessage());
        }
    }

    public String getUsernameFromToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(Keys.hmacShaKeyFor(jwtConfig.getSecret().getBytes()))
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            String username = claims.getSubject();
            log.debug("Username extraÃ­do do token: {}", username);
            return username;
        } catch (Exception e) {
            log.error("Erro ao extrair username do token: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao extrair username do token: " + e.getMessage());
        }
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(Keys.hmacShaKeyFor(jwtConfig.getSecret().getBytes()))
                    .build()
                    .parseClaimsJws(token);
            log.debug("Token vÃ¡lido");
            return true;
        } catch (Exception e) {
            log.error("Token invÃ¡lido: {}", e.getMessage());
            return false;
        }
    }
} 
