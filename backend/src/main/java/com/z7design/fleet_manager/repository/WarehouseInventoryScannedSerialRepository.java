package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.WarehouseInventoryScannedSerial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WarehouseInventoryScannedSerialRepository extends JpaRepository<WarehouseInventoryScannedSerial, UUID> {

    List<WarehouseInventoryScannedSerial> findByAuditId(UUID auditId);

    List<WarehouseInventoryScannedSerial> findByAuditIdAndProductId(UUID auditId, UUID productId);
}
