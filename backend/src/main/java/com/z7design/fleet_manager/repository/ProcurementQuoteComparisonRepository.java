package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ProcurementQuoteComparison;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProcurementQuoteComparisonRepository extends JpaRepository<ProcurementQuoteComparison, UUID> {

    List<ProcurementQuoteComparison> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);

    Optional<ProcurementQuoteComparison> findByRequisitionId(UUID requisitionId);

    Optional<ProcurementQuoteComparison> findByIdAndCompanyId(UUID id, UUID companyId);
}
