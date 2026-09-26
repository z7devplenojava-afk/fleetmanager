package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.WarehouseInventoryAudit;
import com.z7design.fleet_manager.model.enums.WarehouseInventoryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WarehouseInventoryAuditRepository extends JpaRepository<WarehouseInventoryAudit, UUID> {

    Optional<WarehouseInventoryAudit> findByCompanyIdAndCode(UUID companyId, String code);

    Page<WarehouseInventoryAudit> findByCompanyIdOrderByOpenedAtDesc(UUID companyId, Pageable pageable);

    Page<WarehouseInventoryAudit> findByCompanyIdAndStatusOrderByOpenedAtDesc(UUID companyId, WarehouseInventoryStatus status, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM WarehouseInventoryAudit a " +
           "WHERE a.companyId = :companyId " +
           "AND a.freezeMovements = true " +
           "AND a.status IN (com.z7design.fleet_manager.model.enums.WarehouseInventoryStatus.CRIADO, " +
           "com.z7design.fleet_manager.model.enums.WarehouseInventoryStatus.EM_CONTAGEM, " +
           "com.z7design.fleet_manager.model.enums.WarehouseInventoryStatus.CONFERENCIA)")
    java.util.List<WarehouseInventoryAudit> findActiveFreezingAudits(@org.springframework.data.repository.query.Param("companyId") UUID companyId);
}
