package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.CostSimulation;
import com.z7design.fleet_manager.model.enums.CostSimulationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CostSimulationRepository extends JpaRepository<CostSimulation, UUID> {

    List<CostSimulation> findByClientId(UUID clientId);

    List<CostSimulation> findByStatus(CostSimulationStatus status);

    List<CostSimulation> findByClientIdAndStatus(UUID clientId, CostSimulationStatus status);
}
