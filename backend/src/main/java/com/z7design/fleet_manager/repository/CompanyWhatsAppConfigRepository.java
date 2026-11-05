package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.CompanyWhatsAppConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompanyWhatsAppConfigRepository extends JpaRepository<CompanyWhatsAppConfig, UUID> {

    Optional<CompanyWhatsAppConfig> findByCompanyId(UUID companyId);

    boolean existsByCompanyId(UUID companyId);
}
