package com.z7design.fleet_manager.tenant;

import com.z7design.fleet_manager.model.Company;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * JPA EntityListener para entidades TenantAware.
 * Garante atribuição automática da empresa no salvamento e impede mutações cross-tenant.
 */
@Component
@Slf4j
public class TenantEntityListener {

    private static ObjectFactory<EntityManager> entityManagerFactory;

    @Autowired
    public void setEntityManagerFactory(ObjectFactory<EntityManager> entityManagerFactory) {
        TenantEntityListener.entityManagerFactory = entityManagerFactory;
    }

    private boolean isSuperAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN") || a.getAuthority().equals("SUPER_ADMIN"));
    }

    @PrePersist
    public void onPrePersist(Object entity) {
        if (!(entity instanceof TenantAware tenantAware)) {
            return;
        }

        UUID userCompanyId = TenantContext.get();
        if (userCompanyId == null || isSuperAdmin()) {
            return;
        }

        Company currentCompany = tenantAware.getCompany();
        if (currentCompany == null) {
            if (entityManagerFactory != null && entityManagerFactory.getObject() != null) {
                EntityManager em = entityManagerFactory.getObject();
                Company companyRef = em.getReference(Company.class, userCompanyId);
                tenantAware.setCompany(companyRef);
                log.debug("TenantEntityListener: Empresa {} atribuída automaticamente à entidade {}.",
                        userCompanyId, entity.getClass().getSimpleName());
            }
        } else if (!userCompanyId.equals(currentCompany.getId())) {
            log.warn("Tentativa de criar recurso na empresa {} por usuário da empresa {}.",
                    currentCompany.getId(), userCompanyId);
            throw new AccessDeniedException("Acesso negado: Não é permitido criar registros para outra empresa.");
        }
    }

    @PreUpdate
    public void onPreUpdate(Object entity) {
        if (!(entity instanceof TenantAware tenantAware)) {
            return;
        }

        UUID userCompanyId = TenantContext.get();
        if (userCompanyId == null || isSuperAdmin()) {
            return;
        }

        Company company = tenantAware.getCompany();
        if (company != null && !userCompanyId.equals(company.getId())) {
            log.warn("Tentativa de atualizar recurso da empresa {} por usuário da empresa {}.",
                    company.getId(), userCompanyId);
            throw new AccessDeniedException("Acesso negado: Não é permitido alterar registros de outra empresa.");
        }
    }
}
