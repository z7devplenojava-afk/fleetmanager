package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.TimeRecord;
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
public interface TimeRecordRepository extends JpaRepository<TimeRecord, UUID> {

       List<TimeRecord> findByEmployeeIdAndRecordedAtBetweenOrderByRecordedAtAsc(
                     UUID employeeId, LocalDateTime start, LocalDateTime end);

       Page<TimeRecord> findByEmployeeIdOrderByRecordedAtDesc(UUID employeeId, Pageable pageable);

       Page<TimeRecord> findByWorkPostIdOrderByRecordedAtDesc(UUID workPostId, Pageable pageable);

       @Query("SELECT tr FROM TimeRecord tr WHERE tr.employee.id = :employeeId " +
                     "AND CAST(tr.recordedAt AS date) = CURRENT_DATE ORDER BY tr.recordedAt DESC")
       List<TimeRecord> findTodayRecordsByEmployeeId(@Param("employeeId") UUID employeeId);

       @Query(value = "SELECT * FROM time_records tr WHERE tr.employee_id = :employeeId " +
                     "ORDER BY tr.recorded_at DESC LIMIT 1", nativeQuery = true)
       Optional<TimeRecord> findLastRecordByEmployeeId(@Param("employeeId") UUID employeeId);

       @Query(value = "SELECT COUNT(*) FROM time_records tr WHERE tr.employee_id = :employeeId " +
                     "AND EXTRACT(YEAR FROM tr.recorded_at) = :year " +
                     "AND EXTRACT(MONTH FROM tr.recorded_at) = :month", nativeQuery = true)
       Long countByEmployeeIdAndMonthYear(
                     @Param("employeeId") UUID employeeId,
                     @Param("month") int month,
                     @Param("year") int year);

       Page<TimeRecord> findByStatusOrderByRecordedAtDesc(TimeRecord.RecordStatus status, Pageable pageable);

       // Time Control Module - Buscar registros por funcionário e data específica
       @Query("SELECT tr FROM TimeRecord tr WHERE tr.employee.id = :employeeId " +
                     "AND CAST(tr.recordedAt AS date) = :date ORDER BY tr.recordedAt ASC")
       List<TimeRecord> findByEmployeeIdAndDate(
                     @Param("employeeId") UUID employeeId,
                     @Param("date") java.time.LocalDate date);
}
