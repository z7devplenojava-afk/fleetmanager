package com.z7design.fleet_manager.tenant;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Filter;
import org.hibernate.Session;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Ativa ou desativa o filtro de tenant na sessão Hibernate atual.
 */
@Component
@Slf4j
public class TenantFilterActivator {

    @PersistenceContext
    private EntityManager entityManager;

    public void apply() {
        UUID companyId = TenantContext.get();

        try {
            Session session = entityManager.unwrap(Session.class);
            if (session == null) {
                return;
            }

            if (companyId != null) {
                Filter filter = session.enableFilter("tenantFilter");
                filter.setParameter("companyId", companyId);
                log.debug("TenantFilter ENABLED for companyId: {}", companyId);
            } else {
                session.disableFilter("tenantFilter");
                log.debug("TenantFilter DISABLED (companyId is null)");
            }
        } catch (Exception e) {
            log.error("Erro ao aplicar TenantFilter no Hibernate: {}", e.getMessage(), e);
        }
    }
}
