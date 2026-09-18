package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ProcurementPurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProcurementPurchaseOrderRepository extends JpaRepository<ProcurementPurchaseOrder, UUID> {

    List<ProcurementPurchaseOrder> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);

    List<ProcurementPurchaseOrder> findByCompanyIdAndStatusOrderByCreatedAtDesc(UUID companyId, ProcurementPurchaseOrder.PurchaseOrderStatus status);

    Optional<ProcurementPurchaseOrder> findByIdAndCompanyId(UUID id, UUID companyId);

    Optional<ProcurementPurchaseOrder> findByRequisitionId(UUID requisitionId);
}
