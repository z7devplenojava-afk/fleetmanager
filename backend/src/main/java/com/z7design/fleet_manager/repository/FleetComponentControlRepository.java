package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.FleetComponentControl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FleetComponentControlRepository extends JpaRepository<FleetComponentControl, UUID> {
    List<FleetComponentControl> findByCompanyIdAndIsLatestTrue(UUID companyId);

    List<FleetComponentControl> findByIsLatestTrue();

    List<FleetComponentControl> findByVehicleIdAndControlTypeAndIsLatestTrue(UUID vehicleId, String controlType);

    List<FleetComponentControl> findByVehicleIdAndControlTypeOrderByServiceDateDescCreatedAtDesc(UUID vehicleId, String controlType);

    Optional<FleetComponentControl> findFirstByWorkOrderIdAndControlType(UUID workOrderId, String controlType);
}

