package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.WarehouseMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WarehouseMovementRepository extends JpaRepository<WarehouseMovement, UUID> {

    Page<WarehouseMovement> findByCompanyIdOrderByMovementDateDesc(UUID companyId, Pageable pageable);

    List<WarehouseMovement> findByCompanyIdAndProductIdOrderByMovementDateDesc(UUID companyId, UUID productId);

    List<WarehouseMovement> findByVehicleIdOrderByMovementDateDesc(UUID vehicleId);

    List<WarehouseMovement> findByTireIdOrderByMovementDateDesc(UUID tireId);

    List<WarehouseMovement> findByBatteryIdOrderByMovementDateDesc(UUID batteryId);
}
