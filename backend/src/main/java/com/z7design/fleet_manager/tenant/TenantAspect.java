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

            // Só tenta ativar o filtro se tivermos uma sessão Hibernate válida e um
            // companyId
            if (companyId != null && entityManager != null) {
                try {
                    Session session = entityManager.unwrap(Session.class);
                    if (session != null) {
                        Filter filter = session.enableFilter("tenantFilter");
                        filter.setParameter("companyId", companyId);
                        log.info("AGGRESSIVE_DEBUG: TenantFilter ENABLED for companyId: {}", companyId);
                    } else {
                        log.warn("AGGRESSIVE_DEBUG: Could not enable TenantFilter: Session is NULL");
                    }
                } catch (Exception e) {
                    log.error("AGGRESSIVE_DEBUG: Error enabling TenantFilter: {}", e.getMessage(), e);
                }
            } else if (companyId == null) {
                log.info("AGGRESSIVE_DEBUG: TenantFilter NOT enabled: companyId is NULL");
            }
        } catch (Exception e) {
            log.warn("Erro ao configurar TenantFilter: {}", e.getMessage());
        }
    }
}
