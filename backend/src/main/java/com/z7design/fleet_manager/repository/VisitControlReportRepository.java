package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.VisitControlReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VisitControlReportRepository extends JpaRepository<VisitControlReport, UUID> {
    List<VisitControlReport> findByCreatedByIdOrderByCreatedAtDesc(UUID createdById);
    List<VisitControlReport> findAllByOrderByCreatedAtDesc();
}













