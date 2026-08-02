package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.VehicleBattery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VehicleBatteryRepository extends JpaRepository<VehicleBattery, UUID> {

    List<VehicleBattery> findByVehicleIdOrderByInstallDateDesc(UUID vehicleId);

    List<VehicleBattery> findByStatusOrderByCreatedAtDesc(VehicleBattery.BatteryStatus status);

    List<VehicleBattery> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);
}
