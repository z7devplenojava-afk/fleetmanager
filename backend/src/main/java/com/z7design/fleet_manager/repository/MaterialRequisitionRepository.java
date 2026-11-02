package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.MaterialRequisition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MaterialRequisitionRepository extends JpaRepository<MaterialRequisition, UUID> {

    @Query("SELECT r FROM MaterialRequisition r WHERE r.companyId = :companyId ORDER BY r.createdAt DESC")
    List<MaterialRequisition> findByCompanyIdOrderByCreatedAtDesc(@Param("companyId") UUID companyId);

    @Query("SELECT r FROM MaterialRequisition r WHERE r.workOrderId = :workOrderId ORDER BY r.createdAt DESC")
    List<MaterialRequisition> findByWorkOrderIdOrderByCreatedAtDesc(@Param("workOrderId") UUID workOrderId);

    @Query("SELECT r FROM MaterialRequisition r WHERE r.vehicleId = :vehicleId ORDER BY r.createdAt DESC")
    List<MaterialRequisition> findByVehicleIdOrderByCreatedAtDesc(@Param("vehicleId") UUID vehicleId);

    @Query("SELECT r FROM MaterialRequisition r WHERE r.companyId = :companyId AND r.status = :status ORDER BY r.createdAt DESC")
    List<MaterialRequisition> findByCompanyIdAndStatusOrderByCreatedAtDesc(
            @Param("companyId") UUID companyId, 
            @Param("status") MaterialRequisition.RequisitionStatus status);

    @Query("SELECT r FROM MaterialRequisition r WHERE r.id = :id AND r.companyId = :companyId")
    Optional<MaterialRequisition> findByIdAndCompanyId(@Param("id") UUID id, @Param("companyId") UUID companyId);

    @Query("SELECT COUNT(r) FROM MaterialRequisition r WHERE r.companyId = :companyId AND r.urgency = 'EMERGENCIA' AND r.status NOT IN ('INSTALLED_COMPLETED', 'REJECTED', 'CANCELLED')")
    long countPendingEmergencyRequisitions(@Param("companyId") UUID companyId);
}
