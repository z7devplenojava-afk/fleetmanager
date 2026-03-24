// src/main/java/com.z7design.fleet_manager/repository/VisitRepository.java
package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Visit;
import com.z7design.fleet_manager.model.enums.VisitStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface VisitRepository extends JpaRepository<Visit, UUID> {
    
    // Busca por data
    List<Visit> findByVisitDate(LocalDate visitDate);
    Page<Visit> findByVisitDateBetween(LocalDate start, LocalDate end, Pageable pageable);
    
    // Busca por supervisor
    List<Visit> findBySupervisorId(UUID supervisorId);
    Page<Visit> findBySupervisorId(UUID supervisorId, Pageable pageable);
    
    // Busca por posto de trabalho (nÃ£o mais unitId!)
    List<Visit> findByWorkPostId(UUID workPostId);
    Page<Visit> findByWorkPostId(UUID workPostId, Pageable pageable);
    
    // Busca por cliente
    List<Visit> findByClientId(UUID clientId);
    Page<Visit> findByClientId(UUID clientId, Pageable pageable);
    
    // Busca por status
    List<Visit> findByStatus(VisitStatus status);
    Page<Visit> findByStatus(VisitStatus status, Pageable pageable);
    
    // Queries customizadas
    @Query("SELECT v FROM Visit v WHERE v.visitDate = CURRENT_DATE AND v.status = com.z7design.fleet_manager.model.enums.VisitStatus.PENDING")
    List<Visit> findScheduledVisitsForToday();
    
    @Query("SELECT v FROM Visit v WHERE v.visitDate = CURRENT_DATE AND v.supervisor.id = :supervisorId")
    List<Visit> findSupervisorVisitsForToday(@Param("supervisorId") UUID supervisorId);
    
    @Query("SELECT v FROM Visit v WHERE v.workPost.id = :workPostId AND v.visitDate BETWEEN :startDate AND :endDate")
    List<Visit> findByWorkPostAndDateRange(
        @Param("workPostId") UUID workPostId, 
        @Param("startDate") LocalDate startDate, 
        @Param("endDate") LocalDate endDate
    );
}

