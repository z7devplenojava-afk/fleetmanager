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

    List<MaterialRequisition> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);

    List<MaterialRequisition> findByWorkOrderIdOrderByCreatedAtDesc(UUID workOrderId);

    List<MaterialRequisition> findByVehicleIdOrderByCreatedAtDesc(UUID vehicleId);

    List<MaterialRequisition> findByCompanyIdAndStatusOrderByCreatedAtDesc(UUID companyId, MaterialRequisition.RequisitionStatus status);

    Optional<MaterialRequisition> findByIdAndCompanyId(UUID id, UUID companyId);

    @Query("SELECT COUNT(r) FROM MaterialRequisition r WHERE r.companyId = :companyId AND r.urgency = 'EMERGENCIA' AND r.status NOT IN ('INSTALLED_COMPLETED', 'REJECTED', 'CANCELLED')")
    long countPendingEmergencyRequisitions(@Param("companyId") UUID companyId);
}
