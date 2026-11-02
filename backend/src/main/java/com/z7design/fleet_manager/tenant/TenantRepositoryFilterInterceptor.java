package com.z7design.fleet_manager.tenant;

import lombok.RequiredArgsConstructor;
import org.aopalliance.intercept.MethodInterceptor;
import org.aopalliance.intercept.MethodInvocation;
import org.springframework.stereotype.Component;

/**
 * Ativa o filtro de tenant antes de qualquer chamada a repositório, inclusive
 * quando o repositório é usado diretamente por um controller.
 */
@Component
@RequiredArgsConstructor
public class TenantRepositoryFilterInterceptor implements MethodInterceptor {

    private final TenantFilterActivator tenantFilterActivator;

    @Override
    public Object invoke(MethodInvocation invocation) throws Throwable {
        tenantFilterActivator.apply();
        return invocation.proceed();
    }
}
