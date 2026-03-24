package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.PontoRaw;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PontoRawRepository extends JpaRepository<PontoRaw, UUID> {

    List<PontoRaw> findByEmployeeIdOrderByTimestampAsc(UUID employeeId);

    List<PontoRaw> findByEmployeeIdAndTimestampBetweenOrderByTimestampAsc(
            UUID employeeId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT pr FROM PontoRaw pr WHERE pr.employee.id = :employeeId " +
           "AND CAST(pr.timestamp AS date) = :date ORDER BY pr.timestamp ASC")
    List<PontoRaw> findByEmployeeIdAndDate(@Param("employeeId") UUID employeeId, @Param("date") LocalDate date);

    List<PontoRaw> findByImportJobId(UUID importJobId);

    List<PontoRaw> findByImportHash(String importHash);

    @Query("SELECT pr FROM PontoRaw pr WHERE pr.processed = false ORDER BY pr.timestamp ASC")
    Page<PontoRaw> findUnprocessed(Pageable pageable);

    List<PontoRaw> findByEmployeeIdAndProcessedFalse(UUID employeeId);

    @Query("SELECT pr FROM PontoRaw pr WHERE pr.employee.id = :employeeId " +
           "AND pr.timestamp >= :startDate AND pr.timestamp < :endDate " +
           "ORDER BY pr.timestamp ASC")
    List<PontoRaw> findByEmployeeIdAndPeriod(
            @Param("employeeId") UUID employeeId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    boolean existsByEmployeeIdAndTimestampAndTipo(UUID employeeId, LocalDateTime timestamp, PontoRaw.BatidaTipo tipo);

    @Query("SELECT COUNT(pr) FROM PontoRaw pr WHERE pr.importJobId = :importJobId")
    Long countByImportJobId(@Param("importJobId") UUID importJobId);

    @Query("SELECT COUNT(pr) FROM PontoRaw pr WHERE pr.importJobId = :importJobId AND pr.processed = true")
    Long countProcessedByImportJobId(@Param("importJobId") UUID importJobId);
}






