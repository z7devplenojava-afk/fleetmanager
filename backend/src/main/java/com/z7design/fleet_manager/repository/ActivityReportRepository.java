package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ActivityReport;
import com.z7design.fleet_manager.model.enums.ActivityReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ActivityReportRepository extends JpaRepository<ActivityReport, UUID>, JpaSpecificationExecutor<ActivityReport> {

    List<ActivityReport> findByEmployeeId(UUID employeeId);
    List<ActivityReport> findByClientId(UUID clientId);
    List<ActivityReport> findByWorkPostId(UUID workPostId);
    List<ActivityReport> findByDateBetween(LocalDate startDate, LocalDate endDate);
    List<ActivityReport> findByStatus(ActivityReportStatus status);
    List<ActivityReport> findBySupervisorId(UUID supervisorId);

    // CombinaÃ§Ãµes de filtros
    List<ActivityReport> findByEmployeeIdAndDateBetween(UUID employeeId, LocalDate startDate, LocalDate endDate);
    List<ActivityReport> findByClientIdAndDateBetween(UUID clientId, LocalDate startDate, LocalDate endDate);
    List<ActivityReport> findByWorkPostIdAndDateBetween(UUID workPostId, LocalDate startDate, LocalDate endDate);
    List<ActivityReport> findBySupervisorIdAndDateBetween(UUID supervisorId, LocalDate startDate, LocalDate endDate);

    List<ActivityReport> findByClientIdAndStatus(UUID clientId, ActivityReportStatus status);

    // Para filtros mais complexos, o JpaSpecificationExecutor Ã© Ãºtil
}

