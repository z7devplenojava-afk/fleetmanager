package com.z7design.fleet_manager.tenant;

import lombok.RequiredArgsConstructor;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;

/**
 * Aspecto que intercepta chamadas de serviço e ativa o filtro de tenant no
 * Hibernate.
 * Isso garante que todas as queries JPA/Hibernate respeitem o isolamento de
 * dados.
 */
@Aspect
@Component
@RequiredArgsConstructor
public class TenantAspect {

    private final TenantFilterActivator tenantFilterActivator;

    @Before("execution(* com.z7design.fleet_manager.service..*.*(..))")
    public void enableTenantFilter() {
        tenantFilterActivator.apply();
    }
}
