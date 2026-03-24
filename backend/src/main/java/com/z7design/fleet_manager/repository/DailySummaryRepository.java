package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.DailySummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailySummaryRepository extends JpaRepository<DailySummary, UUID> {

    Optional<DailySummary> findByEmployeeIdAndReferenceDate(UUID employeeId, LocalDate referenceDate);

    List<DailySummary> findByEmployeeIdAndReferenceDateBetween(
            UUID employeeId,
            LocalDate startDate,
            LocalDate endDate);

    List<DailySummary> findByEmployeeIdAndReferenceDateBetweenOrderByReferenceDateAsc(
            UUID employeeId,
            LocalDate startDate,
            LocalDate endDate);

    List<DailySummary> findByCompanyIdAndReferenceDateBetween(
            UUID companyId,
            LocalDate startDate,
            LocalDate endDate);
}
