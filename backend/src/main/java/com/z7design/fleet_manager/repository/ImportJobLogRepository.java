package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ImportJobLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ImportJobLogRepository extends JpaRepository<ImportJobLog, UUID> {

    Optional<ImportJobLog> findByImportHash(String importHash);

    List<ImportJobLog> findByStatus(ImportJobLog.ImportStatus status);

    List<ImportJobLog> findByImportedByIdOrderByImportedAtDesc(UUID importedById);

    Page<ImportJobLog> findAllByOrderByImportedAtDesc(Pageable pageable);

    @Query("SELECT ijl FROM ImportJobLog ijl WHERE ijl.importedAt >= :startDate AND ijl.importedAt <= :endDate " +
           "ORDER BY ijl.importedAt DESC")
    List<ImportJobLog> findByPeriod(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(ijl) FROM ImportJobLog ijl WHERE ijl.status = :status")
    Long countByStatus(@Param("status") ImportJobLog.ImportStatus status);

    @Query("SELECT ijl FROM ImportJobLog ijl WHERE ijl.status IN ('PENDING', 'PROCESSING') " +
           "ORDER BY ijl.importedAt ASC")
    List<ImportJobLog> findPendingOrProcessing();
}






