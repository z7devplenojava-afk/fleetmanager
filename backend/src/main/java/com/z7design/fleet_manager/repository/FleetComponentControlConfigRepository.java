package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.FleetComponentControlConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FleetComponentControlConfigRepository extends JpaRepository<FleetComponentControlConfig, UUID> {
    Optional<FleetComponentControlConfig> findByCompanyId(UUID companyId);
}

