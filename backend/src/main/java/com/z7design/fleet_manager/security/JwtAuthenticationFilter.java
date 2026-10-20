package com.z7design.fleet_manager.security;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.context.annotation.Lazy;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;

import com.z7design.fleet_manager.config.JwtConfig;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.UserOnlineStatusService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;
    @Lazy
    private final UserDetailsService userDetailsService;
    private final JwtConfig jwtConfig;
    private final UserOnlineStatusService userOnlineStatusService;

    public JwtAuthenticationFilter(JwtService jwtService, @Lazy UserDetailsService userDetailsService,
            JwtConfig jwtConfig, UserOnlineStatusService userOnlineStatusService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.jwtConfig = jwtConfig;
        this.userOnlineStatusService = userOnlineStatusService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();

        // Pular filtro para recursos estÃ¡ticos pÃºblicos (logos, uploads, etc)
        if (path.startsWith("/api/uploads/companies/logos/") ||
                path.startsWith("/uploads/") ||
                path.startsWith("/holerites/") ||
                path.startsWith("/api/auth/") ||
                path.startsWith("/swagger-ui") ||
                path.startsWith("/v3/api-docs") ||
                path.startsWith("/api/public/") ||
                path.startsWith("/api/health") ||
                path.startsWith("/ws") ||
                path.startsWith("/error")) {
            return true;
        }

        return false;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        try {
            final String authHeader = request.getHeader(jwtConfig.getHeader());
            log.debug("Processing request: {} {}", request.getMethod(), request.getRequestURI());
            log.debug("Authorization header: {}", authHeader);

            if (authHeader == null) {
                log.debug("No Authorization header found for request: {} {}", request.getMethod(),
                        request.getRequestURI());
                filterChain.doFilter(request, response);
                return;
            }

            if (!authHeader.startsWith(jwtConfig.getPrefix() + " ")) {
                log.warn("Invalid Authorization header format. Expected: {} <token>, got: {}",
                        jwtConfig.getPrefix(), authHeader);
                filterChain.doFilter(request, response);
                return;
            }

            final String jwt = authHeader.substring(jwtConfig.getPrefix().length() + 1);
            log.debug("JWT token length: {}", jwt != null ? jwt.length() : 0);

            if (jwt == null || jwt.trim().isEmpty()) {
                log.warn("Empty JWT token received");
                filterChain.doFilter(request, response);
                return;
            }

            if (!jwt.contains(".")) {
                log.error("Invalid JWT format: token does not contain required periods. Token: {}", jwt);
                filterChain.doFilter(request, response);
                return;
            }

            final String username = jwtService.extractUsername(jwt);
            log.debug("Extracted username from token: {}", username);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
                log.debug("Loaded user details for username: {}", username);
                log.debug("User authorities: {}", userDetails.getAuthorities());

                // BLOQUEIO DE CONTA: usuário bloqueado (permanente ou por tempo) é barrado
                // em todas as requisições, mesmo com JWT ainda válido — exibe mensagem para
                // que ele procure o Administrador do sistema.
                if (userDetails instanceof User blockedUserCheck && isCurrentlyBlocked(blockedUserCheck)) {
                    respondBlocked(response, blockedUserCheck);
                    return;
                }

                if (jwtService.isTokenValid(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    log.debug("Authentication successful for user: {} with authorities: {}", username,
                            userDetails.getAuthorities());

                    // HEARTBEAT: registra atividade REST para o status online (Gestão de
                    // Usuários). Assim usuários logados aparecem online mesmo quando a
                    // conexão WebSocket não estabelece.
                    if (userDetails instanceof User activeUser) {
                        try {
                            userOnlineStatusService.recordActivity(activeUser.getId());
                        } catch (Exception e) {
                            log.debug("Falha ao registrar heartbeat de {}: {}", username, e.getMessage());
                        }
                    }
                } else {
                    log.warn("Invalid JWT token for user: {}", username);
                }
            } else if (username == null) {
                log.warn("Could not extract username from JWT token");
            } else {
                log.debug("User already authenticated: {}", username);
            }
        } catch (ExpiredJwtException e) {
            // Token expirado: retorna 401 explícito para o frontend acionar o refresh
            log.warn("JWT expirado para request {} {}: {}", request.getMethod(), request.getRequestURI(), e.getMessage());
            respondUnauthorized(response, "TOKEN_EXPIRED", "Token de acesso expirado. Faça login novamente.");
            return;
        } catch (MalformedJwtException | SignatureException e) {
            log.warn("JWT inválido para request {} {}: {}", request.getMethod(), request.getRequestURI(), e.getMessage());
            respondUnauthorized(response, "TOKEN_INVALID", "Token de acesso inválido.");
            return;
        } catch (Exception e) {
            if (e.getCause() instanceof ExpiredJwtException || (e.getMessage() != null && e.getMessage().toLowerCase().contains("expired"))) {
                log.warn("JWT expirado (encapsulado) para request {} {}: {}", request.getMethod(), request.getRequestURI(), e.getMessage());
                respondUnauthorized(response, "TOKEN_EXPIRED", "Token de acesso expirado. Faça login novamente.");
                return;
            }
            log.error("Erro inesperado ao processar JWT para {} {}: {}",
                    request.getMethod(), request.getRequestURI(), e.getMessage(), e);
        }

        filterChain.doFilter(request, response);
    }

    /** Resposta 401 padronizada para tokens expirados ou inválidos. */
    private void respondUnauthorized(HttpServletResponse response, String code, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(
                "{\"code\": \"" + code + "\", \"message\": \"" + message.replace("\"", "\\\"") + "\"}");
    }

    /** Bloqueio permanente (blockedUntil nulo) ou temporário ainda vigente. */
    private boolean isCurrentlyBlocked(User user) {
        if (user.getBlocked() == null || !user.getBlocked()) {
            return false;
        }
        LocalDateTime until = user.getBlockedUntil();
        return until == null || until.isAfter(LocalDateTime.now());
    }

    /** Resposta 403 com mensagem em português para o frontend exibir ao usuário bloqueado. */
    private void respondBlocked(HttpServletResponse response, User user) throws IOException {
        log.warn("Usuário bloqueado tentando acessar o sistema: {}", user.getUsername());
        LocalDateTime until = user.getBlockedUntil();
        String untilMsg = (until != null)
                ? " até " + until.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
                : " de forma permanente";
        String message = "Sua conta foi bloqueada pelo Administrador" + untilMsg
                + ". Procure o Administrador do sistema para mais informações.";

        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(
                "{\"code\": \"USER_BLOCKED\", \"message\": \"" + message.replace("\"", "\\\"") + "\"}");
    }
}
