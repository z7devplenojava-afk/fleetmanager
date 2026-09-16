package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.GeneratedContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GeneratedContractRepository extends JpaRepository<GeneratedContract, UUID> {

    List<GeneratedContract> findByClientIdOrderByVersionDesc(UUID clientId);

    List<GeneratedContract> findByCostSimulationIdOrderByVersionDesc(UUID costSimulationId);

    List<GeneratedContract> findByTemplateIdOrderByVersionDesc(UUID templateId);

    Optional<GeneratedContract> findTopByClientIdOrderByVersionDesc(UUID clientId);

    List<GeneratedContract> findByStatus(com.z7design.fleet_manager.model.enums.GeneratedContractStatus status);
}
