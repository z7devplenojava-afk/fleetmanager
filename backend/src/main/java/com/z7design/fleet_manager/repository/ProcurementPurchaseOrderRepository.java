package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ProcurementPurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProcurementPurchaseOrderRepository extends JpaRepository<ProcurementPurchaseOrder, UUID> {

    @Query("SELECT po FROM ProcurementPurchaseOrder po WHERE po.companyId = :companyId ORDER BY po.createdAt DESC")
    List<ProcurementPurchaseOrder> findByCompanyIdOrderByCreatedAtDesc(@Param("companyId") UUID companyId);

    @Query("SELECT po FROM ProcurementPurchaseOrder po WHERE po.companyId = :companyId AND po.status = :status ORDER BY po.createdAt DESC")
    List<ProcurementPurchaseOrder> findByCompanyIdAndStatusOrderByCreatedAtDesc(
            @Param("companyId") UUID companyId, 
            @Param("status") ProcurementPurchaseOrder.PurchaseOrderStatus status);

    @Query("SELECT po FROM ProcurementPurchaseOrder po WHERE po.id = :id AND po.companyId = :companyId")
    Optional<ProcurementPurchaseOrder> findByIdAndCompanyId(@Param("id") UUID id, @Param("companyId") UUID companyId);

    @Query("SELECT po FROM ProcurementPurchaseOrder po WHERE po.requisitionId = :requisitionId")
    List<ProcurementPurchaseOrder> findByRequisitionId(@Param("requisitionId") UUID requisitionId);
}
