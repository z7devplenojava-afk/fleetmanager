package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.TenantUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantUserRepository extends JpaRepository<TenantUser, UUID> {
    List<TenantUser> findByCompanyId(UUID companyId);
    List<TenantUser> findByUserId(UUID userId);
    Optional<TenantUser> findByCompanyIdAndUserId(UUID companyId, UUID userId);
    Optional<TenantUser> findByCompanyIdAndEmployeeId(UUID companyId, UUID employeeId);
    boolean existsByCompanyIdAndUserId(UUID companyId, UUID userId);
}
