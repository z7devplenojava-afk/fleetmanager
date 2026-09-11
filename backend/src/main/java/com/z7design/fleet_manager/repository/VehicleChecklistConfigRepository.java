package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.VehicleChecklistConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VehicleChecklistConfigRepository extends JpaRepository<VehicleChecklistConfig, UUID> {

    List<VehicleChecklistConfig> findByVehicleIsNullAndIsActiveTrueOrderBySortOrderAsc();

    List<VehicleChecklistConfig> findByVehicleIdAndIsActiveTrueOrderBySortOrderAsc(UUID vehicleId);

    void deleteByVehicleId(UUID vehicleId);

    void deleteByVehicleIsNull();
}
