package com.z7design.fleet_manager.security;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * SEGURANÇA: Rate limiting de tentativas de login por IP.
 *
 * - 10 tentativas / 15 minutos por IP (janela deslizante simples em memória).
 * - Ao exceder, retorna 429 com Retry-After.
 *
 * Nota: em cluster multi-nó, trocar a estrutura in-memory por Redis
 * (a aplicação já possui Redis configurado).
 */
@Component
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_ATTEMPTS = 10;
    private static final Duration WINDOW = Duration.ofMinutes(15);
    private static final Duration BLOCK_DURATION = Duration.ofMinutes(15);

    private final Map<String, AttemptRecord> attempts = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // Aplica apenas ao endpoint de login (e aos de auth por CPF/facial, que também
        // são credenciais)
        String path = request.getRequestURI();
        boolean isLoginAttempt = "POST".equalsIgnoreCase(request.getMethod())
                && (path.equals("/api/auth/login")
                        || path.startsWith("/api/supervisor-auth/"));
        return !isLoginAttempt;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String clientIp = extractClientIp(request);
        String key = clientIp;

        long now = System.currentTimeMillis();
        AttemptRecord record = attempts.compute(key, (k, existing) -> {
            if (existing == null || now - existing.windowStart > WINDOW.toMillis()) {
                AttemptRecord fresh = new AttemptRecord(now);
                fresh.blockedUntil = existing != null ? existing.blockedUntil : 0;
                return fresh;
            }
            return existing;
        });

        // IP bloqueado? Rejeita imediatamente e renova o bloqueio (lockout contínuo
        // enquanto insistir)
        if (record.blockedUntil > now) {
            record.blockedUntil = now + BLOCK_DURATION.toMillis();
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Retry-After", String.valueOf(BLOCK_DURATION.toSeconds()));
            response.getWriter().write(
                    "{\"error\": \"Too Many Requests\", \"message\": \"Muitas tentativas de login. Tente novamente em alguns minutos.\"}");
            return;
        }

        // Registra a tentativa ANTES do processamento
        int count = record.count.incrementAndGet();

        if (count > MAX_ATTEMPTS) {
            record.blockedUntil = now + BLOCK_DURATION.toMillis();
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Retry-After", String.valueOf(BLOCK_DURATION.toSeconds()));
            response.getWriter().write(
                    "{\"error\": \"Too Many Requests\", \"message\": \"Muitas tentativas de login. Tente novamente em alguns minutos.\"}");
            return;
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            // Login bem-sucedido reseta o contador para o IP
            if (response.getStatus() == HttpStatus.OK.value()) {
                attempts.remove(key);
            }
        }
    }

    /**
     * Extrai o IP real do cliente considerando proxy/CDN (Cloudflare/Traefik/Nginx).
     */
    private String extractClientIp(HttpServletRequest request) {
        String[] headers = { "CF-Connecting-IP", "X-Real-IP", "X-Forwarded-For" };
        for (String header : headers) {
            String value = request.getHeader(header);
            if (value != null && !value.isBlank()) {
                // X-Forwarded-For pode ter lista: pega o primeiro
                return value.split(",")[0].trim();
            }
        }
        return request.getRemoteAddr();
    }

    private static class AttemptRecord {
        final long windowStart;
        final AtomicInteger count = new AtomicInteger(0);
        volatile long blockedUntil = 0;

        AttemptRecord(long windowStart) {
            this.windowStart = windowStart;
        }
    }
}
