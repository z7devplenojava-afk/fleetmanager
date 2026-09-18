package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ProcurementQuoteOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProcurementQuoteOptionRepository extends JpaRepository<ProcurementQuoteOption, UUID> {

    List<ProcurementQuoteOption> findByComparisonId(UUID comparisonId);
}
