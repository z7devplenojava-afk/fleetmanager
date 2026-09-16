package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.MobilizationInspection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MobilizationInspectionRepository extends JpaRepository<MobilizationInspection, UUID> {

    List<MobilizationInspection> findByVehicleIdOrderByInspectionDateDesc(UUID vehicleId);

    List<MobilizationInspection> findByClientIdOrderByInspectionDateDesc(UUID clientId);

    List<MobilizationInspection> findByVehiclePlateOrderByInspectionDateDesc(String vehiclePlate);

    List<MobilizationInspection> findByApprovedTrue();
}
