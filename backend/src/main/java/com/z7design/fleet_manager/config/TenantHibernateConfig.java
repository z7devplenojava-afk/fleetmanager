package com.z7design.fleet_manager.config;

import com.z7design.fleet_manager.tenant.TenantHibernateEventListener;
import com.z7design.fleet_manager.tenant.TenantIntegrator;
import com.z7design.fleet_manager.tenant.TenantRepositoryFilterInterceptor;
import lombok.RequiredArgsConstructor;
import org.hibernate.jpa.boot.spi.IntegratorProvider;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.repository.core.support.RepositoryFactoryCustomizer;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class TenantHibernateConfig {

    private final TenantHibernateEventListener tenantHibernateEventListener;

    @Bean
    public HibernatePropertiesCustomizer tenantIntegratorCustomizer() {
        return properties -> properties.put(
                "hibernate.integrator_provider",
                (IntegratorProvider) () -> List.of(new TenantIntegrator(tenantHibernateEventListener)));
    }

    @Bean
    public RepositoryFactoryCustomizer tenantRepositoryFilterCustomizer(
            TenantRepositoryFilterInterceptor interceptor) {
        return factory -> factory.addRepositoryProxyPostProcessor(
                (proxyFactory, repositoryInformation) -> proxyFactory.addAdvice(interceptor));
    }
}
