package com.z7design.fleet_manager.tenant;

import com.z7design.fleet_manager.model.Company;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.engine.spi.SessionImplementor;
import org.hibernate.event.spi.PreDeleteEvent;
import org.hibernate.event.spi.PreDeleteEventListener;
import org.hibernate.event.spi.PreInsertEvent;
import org.hibernate.event.spi.PreInsertEventListener;
import org.hibernate.event.spi.PreUpdateEvent;
import org.hibernate.event.spi.PreUpdateEventListener;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.UUID;

/**
 * Garante o isolamento por empresa em todas as entidades que possuem
 * {@code companyId} ou o relacionamento {@code company}, mesmo aquelas que
 * ainda não implementam {@link TenantAware}.
 *
 * Na inclusão, atribui automaticamente a empresa do tenant ao registro.
 * Na alteração e na exclusão, bloqueia qualquer tentativa de gravar ou apagar
 * dados de outra empresa.
 */
@Component
@Slf4j
public class TenantHibernateEventListener
        implements PreInsertEventListener, PreUpdateEventListener, PreDeleteEventListener {

    @Override
    public boolean onPreInsert(PreInsertEvent event) {
        apply(event.getEntity(), event.getSession());
        return false;
    }

    @Override
    public boolean onPreUpdate(PreUpdateEvent event) {
        apply(event.getEntity(), event.getSession());
        return false;
    }

    @Override
    public boolean onPreDelete(PreDeleteEvent event) {
        validate(event.getEntity());
        return false;
    }

    private void apply(Object entity, SessionImplementor session) {
        UUID tenantId = validate(entity);
        if (tenantId == null) {
            return;
        }

        if (readFieldCompanyId(entity) == null && assignCompany(entity, session, tenantId)) {
            log.debug("Empresa {} atribuída automaticamente a {}.",
                    tenantId, entity.getClass().getSimpleName());
        }
    }

    private UUID validate(Object entity) {
        if (entity == null) {
            return null;
        }

        UUID tenantId = TenantContext.get();
        if (tenantId == null || isSuperAdmin()) {
            return null;
        }

        UUID fieldCompanyId = readFieldCompanyId(entity);
        UUID relatedCompanyId = readRelatedCompanyId(entity);
        UUID effectiveCompanyId = fieldCompanyId != null ? fieldCompanyId : relatedCompanyId;

        if (effectiveCompanyId != null && !tenantId.equals(effectiveCompanyId)) {
            log.warn("Tentativa de gravar {} da empresa {} por usuário da empresa {}.",
                    entity.getClass().getSimpleName(), effectiveCompanyId, tenantId);
            throw new AccessDeniedException(
                    "Acesso negado: não é permitido gravar registros de outra empresa.");
        }

        return tenantId;
    }

    private boolean isSuperAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        return auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_SUPER_ADMIN".equals(a.getAuthority())
                        || "SUPER_ADMIN".equals(a.getAuthority()));
    }

    private UUID readFieldCompanyId(Object entity) {
        Object companyId = invoke(entity, "getCompanyId");
        return companyId instanceof UUID uuid ? uuid : null;
    }

    private UUID readRelatedCompanyId(Object entity) {
        if (entity instanceof TenantAware tenantAware) {
            Company company = tenantAware.getCompany();
            if (company != null) {
                return company.getId();
            }
        }

        Object company = invoke(entity, "getCompany");
        if (company instanceof Company value) {
            return value.getId();
        }
        return null;
    }

    private boolean assignCompany(Object entity, SessionImplementor session, UUID tenantId) {
        Method setCompanyId = findMethod(entity.getClass(), "setCompanyId", UUID.class);
        if (setCompanyId != null) {
            try {
                setCompanyId.invoke(entity, tenantId);
                return true;
            } catch (ReflectiveOperationException e) {
                log.warn("Não foi possível atribuir companyId em {}: {}",
                        entity.getClass().getSimpleName(), e.getMessage());
            }
        }

        Company reference = session.getReference(Company.class, tenantId);

        if (entity instanceof TenantAware tenantAware) {
            tenantAware.setCompany(reference);
            return true;
        }

        Method setCompany = findMethod(entity.getClass(), "setCompany", Company.class);
        if (setCompany != null) {
            try {
                setCompany.invoke(entity, reference);
                return true;
            } catch (ReflectiveOperationException e) {
                log.warn("Não foi possível atribuir company em {}: {}",
                        entity.getClass().getSimpleName(), e.getMessage());
            }
        }
        return false;
    }

    private Object invoke(Object entity, String methodName) {
        try {
            Method method = entity.getClass().getMethod(methodName);
            return method.invoke(entity);
        } catch (ReflectiveOperationException | RuntimeException e) {
            return null;
        }
    }

    private Method findMethod(Class<?> type, String methodName, Class<?> parameterType) {
        try {
            return type.getMethod(methodName, parameterType);
        } catch (NoSuchMethodException e) {
            return null;
        }
    }
}
