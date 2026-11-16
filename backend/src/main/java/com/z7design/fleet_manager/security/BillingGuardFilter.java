package com.z7design.fleet_manager.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Middleware/Guard de Adimplência (Skill: saas-billing-enforcement)
 * Intercepta requisições de empresas com assinatura em atraso além do período de carência
 * ou canceladas, retornando HTTP 402 Payment Required para rotas operacionais.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BillingGuardFilter extends OncePerRequestFilter {

    private final CompanyRepository companyRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Cache local em memória (TTL curto ou atualizado via webhook) para não onerar o banco em toda requisição (<15ms)
    private final Map<UUID, CachedSubscriptionStatus> statusCache = new ConcurrentHashMap<>();

    private record CachedSubscriptionStatus(boolean isOverdue, String status, long cachedAt) {}

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/api/auth/") ||
               path.startsWith("/api/webhooks/") ||
               path.startsWith("/api/billing/") ||
               path.startsWith("/api/health") ||
               path.startsWith("/swagger-ui") ||
               path.startsWith("/v3/api-docs") ||
               path.startsWith("/api/public/") ||
               path.startsWith("/uploads/") ||
               path.startsWith("/files/") ||
               path.startsWith("/ws") ||
               path.startsWith("/error") ||
               path.equals("/api/users/profile") ||
               path.startsWith("/api/companies/subscription") ||
               path.startsWith("/api/companies/my-subscription");
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // Se não autenticado ou se for Super Admin da plataforma, não bloqueia
        if (auth == null || !auth.isAuthenticated() || isGlobalAdmin(auth)) {
            filterChain.doFilter(request, response);
            return;
        }

        UUID companyId = TenantContext.get();
        if (companyId != null) {
            boolean isOverdue = checkIsOverdueWithCache(companyId);

            if (isOverdue) {
                log.warn("🚨 Acesso operacional bloqueado por inadimplência [HTTP 402] para empresa {}: {}", companyId, request.getRequestURI());
                response.setStatus(402); // HTTP 402 Payment Required
                response.setContentType("application/json;charset=UTF-8");

                Map<String, Object> errorBody = Map.of(
                        "status", 402,
                        "code", "SUBSCRIPTION_BLOCKED",
                        "error", "PAYMENT_REQUIRED",
                        "message", "Acesso operacional temporariamente suspenso devido a pendência na assinatura da empresa. Regularize o faturamento para restabelecer o acesso total.",
                        "companyId", companyId.toString()
                );

                response.getWriter().write(objectMapper.writeValueAsString(errorBody));
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean checkIsOverdueWithCache(UUID companyId) {
        long now = System.currentTimeMillis();
        CachedSubscriptionStatus cached = statusCache.get(companyId);

        // Cache válido por 60 segundos
        if (cached != null && (now - cached.cachedAt() < 60_000)) {
            return cached.isOverdue();
        }

        try {
            Company company = companyRepository.findById(companyId).orElse(null);
            if (company == null) {
                return false;
            }

            boolean overdue = company.isSubscriptionOverdue();
            statusCache.put(companyId, new CachedSubscriptionStatus(overdue, company.getSubscriptionStatus(), now));
            return overdue;
        } catch (Exception e) {
            log.error("Erro ao verificar status de assinatura da empresa {}: {}", companyId, e.getMessage());
            return false;
        }
    }

    public void invalidateCompanyCache(UUID companyId) {
        if (companyId != null) {
            statusCache.remove(companyId);
        }
    }

    private boolean isGlobalAdmin(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a -> {
            String role = a.getAuthority().replace("ROLE_", "");
            return "SUPER_ADMIN".equalsIgnoreCase(role) || "FLEX_ADMIN".equalsIgnoreCase(role);
        });
    }
}
