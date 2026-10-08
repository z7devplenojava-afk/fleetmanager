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

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path.startsWith("/api/auth/") ||
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
                        // 1. Tentar extrair do token primeiro (padrão)
                        UUID empresaId = jwtService.extractEmpresaId(jwt);

                        // 2. Verificar se há cabeçalho explícito de empresa no request (X-Target-Company-ID ou X-Company-ID / X-Company-Id)
                        String companyHeader = request.getHeader("X-Target-Company-ID");
                        if (companyHeader == null || companyHeader.trim().isEmpty()) {
                            companyHeader = request.getHeader("X-Company-ID");
                        }
                        if (companyHeader == null || companyHeader.trim().isEmpty()) {
                            companyHeader = request.getHeader("X-Company-Id");
                        }

                        if (companyHeader != null && !companyHeader.trim().isEmpty() && !"none".equalsIgnoreCase(companyHeader.trim())) {
                            try {
                                UUID headerCompanyId = UUID.fromString(companyHeader.trim());
                                empresaId = headerCompanyId;
                                log.debug("TenantContext ajustado via cabeçalho HTTP para empresa: {}", headerCompanyId);
                            } catch (IllegalArgumentException e) {
                                log.warn("Cabeçalho de empresa inválido ignorado: {}", companyHeader);
                            }
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
}
