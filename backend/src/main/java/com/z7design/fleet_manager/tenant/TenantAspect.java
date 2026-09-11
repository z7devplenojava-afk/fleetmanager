package com.z7design.fleet_manager.tenant;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.hibernate.Session;
import org.hibernate.Filter;
import org.springframework.stereotype.Component;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;

/**
 * Aspecto que intercepta chamadas de serviço e ativa o filtro de tenant no
 * Hibernate.
 * Isso garante que todas as queries JPA/Hibernate respeitem o isolamento de
 * dados.
 */
@Aspect
@Component
@Slf4j
public class TenantAspect {

    @PersistenceContext
    private EntityManager entityManager;

    // Intercepta qualquer método público em classes dentro do pacote service
    @Before("execution(* com.z7design.fleet_manager.service..*.*(..))")
    public void enableTenantFilter() {
        try {
            // Verifica se há um TenantContext definido
            UUID companyId = TenantContext.get();

            if (entityManager != null) {
                try {
                    Session session = entityManager.unwrap(Session.class);
                    if (session != null) {
                        if (companyId != null) {
                            Filter filter = session.enableFilter("tenantFilter");
                            filter.setParameter("companyId", companyId);
                            log.debug("TenantFilter ENABLED for companyId: {}", companyId);
                        } else {
                            session.disableFilter("tenantFilter");
                            log.debug("TenantFilter DISABLED (companyId is null)");
                        }
                    }
                } catch (Exception e) {
                    log.error("Erro ao aplicar TenantFilter no Hibernate: {}", e.getMessage(), e);
                }
            }
        } catch (Exception e) {
            log.warn("Erro ao configurar TenantFilter: {}", e.getMessage());
        }
    }
}
