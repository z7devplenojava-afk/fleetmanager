package com.z7design.fleet_manager.tenant;

import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.event.service.spi.EventListenerRegistry;
import org.hibernate.event.spi.EventType;
import org.hibernate.jpa.boot.spi.IntegratorProvider;
import org.hibernate.service.spi.ServiceRegistryImplementor;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.repository.core.support.RepositoryFactorySupport;

import com.z7design.fleet_manager.config.TenantHibernateConfig;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TenantIntegratorTest {

    @Mock
    private SessionFactoryImplementor sessionFactory;

    @Mock
    private ServiceRegistryImplementor serviceRegistry;

    @Mock
    private EventListenerRegistry listenerRegistry;

    @Test
    void registersListenerForInsertAndUpdate() {
        TenantHibernateEventListener listener = new TenantHibernateEventListener();
        when(sessionFactory.getServiceRegistry()).thenReturn(serviceRegistry);
        when(serviceRegistry.getService(EventListenerRegistry.class)).thenReturn(listenerRegistry);

        new TenantIntegrator(listener).integrate(null, null, sessionFactory);

        verify(listenerRegistry).appendListeners(EventType.PRE_INSERT, listener);
        verify(listenerRegistry).appendListeners(EventType.PRE_UPDATE, listener);
        verify(listenerRegistry).appendListeners(EventType.PRE_DELETE, listener);
    }

    @Test
    void customizerRegistersIntegratorProvider() {
        TenantHibernateConfig config = new TenantHibernateConfig(new TenantHibernateEventListener());
        Map<String, Object> properties = new HashMap<>();

        config.tenantIntegratorCustomizer().customize(properties);

        IntegratorProvider provider = assertInstanceOf(
                IntegratorProvider.class, properties.get("hibernate.integrator_provider"));
        assertEquals(1, provider.getIntegrators().size());
    }

    @Test
    void customizerAddsRepositoryPostProcessor() {
        TenantHibernateConfig config = new TenantHibernateConfig(new TenantHibernateEventListener());
        RepositoryFactorySupport factory = mock(RepositoryFactorySupport.class);

        config.tenantRepositoryFilterCustomizer(mock(TenantRepositoryFilterInterceptor.class))
                .customize(factory);

        verify(factory).addRepositoryProxyPostProcessor(any());
    }
}
