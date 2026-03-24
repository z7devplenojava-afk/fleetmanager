package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.CompanyDefaultEPI;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CompanyDefaultEPIRepository extends JpaRepository<CompanyDefaultEPI, UUID> {
    List<CompanyDefaultEPI> findByCompanyIdOrderByOrderIndexAsc(UUID companyId);
    void deleteByCompanyId(UUID companyId);
}



