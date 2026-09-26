package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.WarehouseInventoryAuditItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WarehouseInventoryAuditItemRepository extends JpaRepository<WarehouseInventoryAuditItem, UUID> {

    List<WarehouseInventoryAuditItem> findByAuditId(UUID auditId);

    List<WarehouseInventoryAuditItem> findByAuditIdAndStatus(UUID auditId, String status);
}
