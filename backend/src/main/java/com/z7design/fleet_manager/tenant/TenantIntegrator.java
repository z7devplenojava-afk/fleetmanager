package com.z7design.fleet_manager.tenant;

import org.hibernate.boot.Metadata;
import org.hibernate.boot.spi.BootstrapContext;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.event.service.spi.EventListenerRegistry;
import org.hibernate.event.spi.EventType;
import org.hibernate.integrator.spi.Integrator;

/**
 * Registra o {@link TenantHibernateEventListener} como listener global do
 * Hibernate, cobrindo a inclusão e a alteração de qualquer entidade.
 */
public class TenantIntegrator implements Integrator {

    private final TenantHibernateEventListener listener;

    public TenantIntegrator(TenantHibernateEventListener listener) {
        this.listener = listener;
    }

    @Override
    public void integrate(Metadata metadata, BootstrapContext bootstrapContext,
            SessionFactoryImplementor sessionFactory) {
        EventListenerRegistry registry = sessionFactory.getServiceRegistry()
                .getService(EventListenerRegistry.class);
        registry.appendListeners(EventType.PRE_INSERT, listener);
        registry.appendListeners(EventType.PRE_UPDATE, listener);
        registry.appendListeners(EventType.PRE_DELETE, listener);
    }

    @Override
    public void disintegrate(SessionFactoryImplementor sessionFactory,
            org.hibernate.service.spi.SessionFactoryServiceRegistry serviceRegistry) {
        // Nada a liberar.
    }
}
