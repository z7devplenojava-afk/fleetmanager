package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.WorkJourneyConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkJourneyConfigRepository extends JpaRepository<WorkJourneyConfig, UUID> {

    Optional<WorkJourneyConfig> findByCompanyId(UUID companyId);

    Optional<WorkJourneyConfig> findByCompanyIdAndAtivoTrue(UUID companyId);

    boolean existsByCompanyId(UUID companyId);
}
