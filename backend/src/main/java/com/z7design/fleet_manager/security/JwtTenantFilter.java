package com.z7design.fleet_manager.security;

import com.z7design.fleet_manager.config.JwtConfig;
import com.z7design.fleet_manager.tenant.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Filtro que extrai empresaId do JWT e injeta no TenantContext.
 * Executa após JwtAuthenticationFilter para garantir que o token já foi
 * validado.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtTenantFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final JwtConfig jwtConfig;
    private final com.z7design.fleet_manager.service.UserCompanyResolver userCompanyResolver;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path.startsWith("/api/auth/") ||
                path.startsWith("/api/player/") ||
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
            String authHeader = request.getHeader(jwtConfig.getHeader());
            if (authHeader != null && authHeader.startsWith(jwtConfig.getPrefix() + " ")) {
                String jwt = authHeader.substring(jwtConfig.getPrefix().length() + 1);
                if (jwt != null && !jwt.trim().isEmpty() && jwt.contains(".")) {
                    try {
                        // 1. Tenant padrão sempre vem do JWT
                        UUID empresaId = jwtService.extractEmpresaId(jwt);

                        // 2. Somente SUPER_ADMIN pode alternar empresa via X-Target-Company-ID ou X-Company-Id
                        String targetHeader = request.getHeader("X-Target-Company-ID");
                        if (targetHeader == null || targetHeader.isBlank() || "none".equalsIgnoreCase(targetHeader.trim())) {
                            targetHeader = request.getHeader("X-Company-Id");
                        }
                        if (targetHeader != null && !targetHeader.isBlank()
                                && !"none".equalsIgnoreCase(targetHeader.trim())) {
                            if (isSuperAdmin()) {
                                try {
                                    empresaId = UUID.fromString(targetHeader.trim());
                                    TenantContext.setImpersonating(true);
                                    log.debug("SUPER_ADMIN alternando contexto para empresa: {}", empresaId);
                                } catch (IllegalArgumentException e) {
                                    log.warn("Target Company-ID inválido ignorado: {}", targetHeader);
                                }
                            } else {
                                log.warn("Target Company-ID ignorado para usuário sem SUPER_ADMIN: {}",
                                        request.getRequestURI());
                            }
                        }

                        // 3. Se ainda for nulo, busca o tenant padrão do usuário ou demonstração FluxBus
                        if (empresaId == null) {
                            empresaId = userCompanyResolver.resolveCurrentCompanyId();
                        }

                        if (empresaId != null) {
                            TenantContext.set(empresaId);
                            log.debug("TenantContext definido para empresaId: {}", empresaId);
                        }
                    } catch (Exception e) {
                        log.debug("Não foi possível extrair empresaId do token: {}", e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Erro ao processar tenant no filtro: {}", e.getMessage());
        } finally {
            try {
                filterChain.doFilter(request, response);
            } finally {
                TenantContext.clear();
            }
        }
    }

    private boolean isSuperAdmin() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_SUPER_ADMIN".equals(a.getAuthority()) || "SUPER_ADMIN".equals(a.getAuthority()));
    }
}
