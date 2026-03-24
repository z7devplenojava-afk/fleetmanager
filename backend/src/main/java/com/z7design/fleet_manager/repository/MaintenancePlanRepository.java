package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.MaintenancePlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MaintenancePlanRepository extends JpaRepository<MaintenancePlan, UUID> {
    List<MaintenancePlan> findByVehicleId(UUID vehicleId);

    List<MaintenancePlan> findByIsActiveTrue();
}
