package com.z7design.fleet_manager.tenant;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;
import org.hibernate.boot.MetadataSources;
import org.hibernate.boot.registry.BootstrapServiceRegistry;
import org.hibernate.boot.registry.BootstrapServiceRegistryBuilder;
import org.hibernate.boot.registry.StandardServiceRegistry;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class TenantIntegratorHibernateTest {

    @AfterEach
    void clearContext() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    void hibernateInvokesIntegratorAndListenerAssignsCompanyOnInsert() {
        UUID tenantId = UUID.randomUUID();
        TenantContext.set(tenantId);

        BootstrapServiceRegistry bootstrapRegistry = new BootstrapServiceRegistryBuilder()
                .applyIntegrator(new TenantIntegrator(new TenantHibernateEventListener()))
                .build();

        StandardServiceRegistry registry = new StandardServiceRegistryBuilder(bootstrapRegistry)
                .applySetting("hibernate.connection.driver_class", "org.h2.Driver")
                .applySetting("hibernate.connection.url", "jdbc:h2:mem:tenant-test;DB_CLOSE_DELAY=-1")
                .applySetting("hibernate.dialect", "org.hibernate.dialect.H2Dialect")
                .applySetting("hibernate.hbm2ddl.auto", "create-drop")
                .build();

        try (SessionFactory sessionFactory = new MetadataSources(registry)
                .addAnnotatedClass(TestEntity.class)
                .buildMetadata()
                .buildSessionFactory();
                Session session = sessionFactory.openSession()) {

            session.beginTransaction();
            TestEntity entity = new TestEntity();
            entity.setId(UUID.randomUUID());
            entity.setName("Teste");
            session.persist(entity);
            session.getTransaction().commit();

            assertNotNull(entity.getCompanyId());
            assertEquals(tenantId, entity.getCompanyId());
        }
    }

    @Entity
    @Table(name = "tenant_test_entities")
    @FilterDef(name = "tenantFilter", parameters = @ParamDef(name = "companyId", type = UUID.class))
    @Filter(name = "tenantFilter", condition = "company_id = :companyId")
    public static class TestEntity {

        @Id
        private UUID id;

        private String name;

        private UUID companyId;

        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public UUID getCompanyId() {
            return companyId;
        }

        public void setCompanyId(UUID companyId) {
            this.companyId = companyId;
        }
    }
}
