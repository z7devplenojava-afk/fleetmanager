package com.z7design.fleet_manager.security;

import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Validador de Segurança de Tenant (Empresa).
 * Garante que usuários não acessem, criem, editem ou excluam registros
 * pertencentes a outra empresa.
 */
@Component
@Slf4j
public class TenantSecurityValidator {

    /**
     * Verifica se o usuário atual é SUPER_ADMIN.
     */
    public boolean isSuperAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN") || a.getAuthority().equals("SUPER_ADMIN"));
    }

    /**
     * Valida se a empresa do recurso/entidade pertence à empresa do usuário logado.
     * 
     * @param targetCompanyId UUID da empresa do recurso
     * @throws AccessDeniedException se o usuário não tiver permissão para acessar o recurso
     */
    public void validateTenantAccess(UUID targetCompanyId) {
        if (isSuperAdmin()) {
            // SUPER_ADMIN tem acesso global ou respeita X-Target-Company-ID se definido
            return;
        }

        UUID userCompanyId = TenantContext.get();
        if (userCompanyId == null) {
            log.warn("Acesso negado: TenantContext não possui empresaId definida para a requisição atual.");
            throw new AccessDeniedException("Acesso negado: Contexto da empresa não identificado.");
        }

        if (targetCompanyId != null && !targetCompanyId.equals(userCompanyId)) {
            log.warn("Tentativa de acesso cross-tenant detectada! Usuário da empresa {} tentou acessar recurso da empresa {}.",
                    userCompanyId, targetCompanyId);
            throw new AccessDeniedException("Acesso negado: Você não possui permissão para acessar ou alterar dados de outra empresa.");
        }
    }

    /**
     * Obtém o UUID da empresa que deve ser atribuído a novos registros.
     * Para usuários comuns, retorna SEMPRE o UUID da empresa do seu JWT.
     * Para SUPER_ADMIN, retorna a empresa informada ou a empresa do contexto.
     */
    public UUID getEffectiveCompanyId(UUID requestedCompanyId) {
        if (isSuperAdmin()) {
            return requestedCompanyId != null ? requestedCompanyId : TenantContext.get();
        }

        UUID userCompanyId = TenantContext.get();
        if (userCompanyId == null) {
            throw new AccessDeniedException("Acesso negado: Nenhuma empresa associada ao seu usuário.");
        }
        return userCompanyId;
    }
}
