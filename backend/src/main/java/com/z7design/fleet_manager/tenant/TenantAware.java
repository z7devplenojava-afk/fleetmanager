package com.z7design.fleet_manager.tenant;

import com.z7design.fleet_manager.model.Company;
import java.util.UUID;

/**
 * Interface implementada por entidades que pertencem a uma empresa (Tenant).
 */
public interface TenantAware {

    default Company getCompany() {
        return null;
    }

    default void setCompany(Company company) {
    }

    default UUID getCompanyId() {
        Company company = getCompany();
        return company != null ? company.getId() : null;
    }
}
