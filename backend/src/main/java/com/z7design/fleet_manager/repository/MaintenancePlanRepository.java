package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.MaintenancePlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface MaintenancePlanRepository extends JpaRepository<MaintenancePlan, UUID> {
    List<MaintenancePlan> findByVehicleId(UUID vehicleId);

    List<MaintenancePlan> findByVehicleIdAndIsActiveTrueOrderById(UUID vehicleId);

    List<MaintenancePlan> findByIsActiveTrueAndVehicle_IdIn(Collection<UUID> vehicleIds);

    List<MaintenancePlan> findByIsActiveTrue();

    @org.springframework.data.jpa.repository.Query("SELECT mp FROM MaintenancePlan mp JOIN FETCH mp.vehicle v " +
            "WHERE mp.isActive = true AND v.deletedAt IS NULL AND (:companyId IS NULL OR mp.companyId = :companyId)")
    List<MaintenancePlan> findActiveWithVehicleByCompany(@org.springframework.data.repository.query.Param("companyId") UUID companyId);
}
