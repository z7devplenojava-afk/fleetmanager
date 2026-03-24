package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.VisitControl;
import com.z7design.fleet_manager.model.enums.VisitControlStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface VisitControlRepository extends JpaRepository<VisitControl, UUID>, VisitControlRepositoryCustom {

    List<VisitControl> findByVisitDate(LocalDate visitDate);

    List<VisitControl> findByStatus(VisitControlStatus status);

    List<VisitControl> findBySupervisorId(UUID supervisorId);

    List<VisitControl> findByWorkPostId(UUID workPostId);

    List<VisitControl> findByVisitDateBetween(LocalDate startDate, LocalDate endDate);

    @Query("SELECT v FROM VisitControl v WHERE v.visitDate = :today")
    List<VisitControl> findTodayVisits(@Param("today") LocalDate today);

    @Query("SELECT COUNT(v) FROM VisitControl v WHERE v.visitDate = :today")
    Long countTodayVisits(@Param("today") LocalDate today);

    @Query("SELECT COUNT(v) FROM VisitControl v WHERE v.status = :status")
    Long countByStatus(@Param("status") VisitControlStatus status);

    @Query("SELECT COUNT(DISTINCT v.supervisor.id) FROM VisitControl v WHERE v.status IN ('SCHEDULED', 'IN_PROGRESS')")
    Long countActiveSupervisors();

    @Query("SELECT v FROM VisitControl v ORDER BY v.scheduledAt DESC, v.visitDate DESC")
    List<VisitControl> findRecentVisits();

    @Query("SELECT CAST(COUNT(v) * 100.0 / NULLIF((SELECT COUNT(v2) FROM VisitControl v2 WHERE v2.status IN ('COMPLETED', 'CANCELLED')), 0) AS double) " +
           "FROM VisitControl v WHERE v.status = 'COMPLETED' AND v.isSuccessful = true")
    Double calculateSuccessRate();

}

