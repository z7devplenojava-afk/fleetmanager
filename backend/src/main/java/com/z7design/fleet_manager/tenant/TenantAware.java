package com.z7design.fleet_manager.tenant;

import java.util.UUID;

/**
 * Interface marcadora para entidades que suportam multi-tenancy.
 * Entidades que implementam essa interface devem ter o campo companyId.
 */
public interface TenantAware {
    UUID getCompanyId();

    void setCompanyId(UUID companyId);
}
