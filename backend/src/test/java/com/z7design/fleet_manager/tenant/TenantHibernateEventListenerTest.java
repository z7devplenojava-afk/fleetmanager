package com.z7design.fleet_manager.tenant;

import org.hibernate.event.spi.EventSource;
import org.hibernate.event.spi.PreDeleteEvent;
import org.hibernate.event.spi.PreInsertEvent;
import org.hibernate.event.spi.PreUpdateEvent;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TenantHibernateEventListenerTest {

    private final TenantHibernateEventListener listener = new TenantHibernateEventListener();

    @Mock
    private PreInsertEvent insertEvent;

    @Mock
    private PreUpdateEvent updateEvent;

    @Mock
    private PreDeleteEvent deleteEvent;

    @Mock
    private EventSource session;

    @AfterEach
    void clearContext() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    void assignsTenantCompanyOnInsertWhenMissing() {
        UUID tenantId = UUID.randomUUID();
        TenantContext.set(tenantId);

        TestEntity entity = new TestEntity();
        when(insertEvent.getEntity()).thenReturn(entity);
        when(insertEvent.getSession()).thenReturn(session);

        listener.onPreInsert(insertEvent);

        assertEquals(tenantId, entity.getCompanyId());
    }

    @Test
    void rejectsInsertForAnotherCompany() {
        UUID tenantId = UUID.randomUUID();
        TenantContext.set(tenantId);

        TestEntity entity = new TestEntity();
        entity.setCompanyId(UUID.randomUUID());
        when(insertEvent.getEntity()).thenReturn(entity);

        assertThrows(AccessDeniedException.class, () -> listener.onPreInsert(insertEvent));
    }

    @Test
    void rejectsUpdateForAnotherCompany() {
        UUID tenantId = UUID.randomUUID();
        TenantContext.set(tenantId);

        TestEntity entity = new TestEntity();
        entity.setCompanyId(UUID.randomUUID());
        when(updateEvent.getEntity()).thenReturn(entity);

        assertThrows(AccessDeniedException.class, () -> listener.onPreUpdate(updateEvent));
    }

    @Test
    void rejectsDeleteForAnotherCompany() {
        UUID tenantId = UUID.randomUUID();
        TenantContext.set(tenantId);

        TestEntity entity = new TestEntity();
        entity.setCompanyId(UUID.randomUUID());
        when(deleteEvent.getEntity()).thenReturn(entity);

        assertThrows(AccessDeniedException.class, () -> listener.onPreDelete(deleteEvent));
    }

    @Test
    void doesNotAssignWhenNoTenantContext() {
        TestEntity entity = new TestEntity();
        when(insertEvent.getEntity()).thenReturn(entity);
        when(insertEvent.getSession()).thenReturn(session);

        listener.onPreInsert(insertEvent);

        assertNull(entity.getCompanyId());
    }

    @Test
    void superAdminCanWriteForAnyCompany() {
        TenantContext.set(UUID.randomUUID());
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "super", null, List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"))));

        TestEntity entity = new TestEntity();
        UUID otherCompany = UUID.randomUUID();
        entity.setCompanyId(otherCompany);
        when(insertEvent.getEntity()).thenReturn(entity);

        listener.onPreInsert(insertEvent);

        assertEquals(otherCompany, entity.getCompanyId());
    }

    static class TestEntity {
        private UUID companyId;

        public UUID getCompanyId() {
            return companyId;
        }

        public void setCompanyId(UUID companyId) {
            this.companyId = companyId;
        }
    }
}
