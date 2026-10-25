package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.TimeRecord;
import com.z7design.fleet_manager.tenant.TenantContext;
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

       @Query(value = "SELECT * FROM time_records tr WHERE tr.employee_id = :employeeId " +
                     "AND CAST(tr.recorded_at AS date) = CURRENT_DATE " +
                     "AND (CAST(:companyId AS uuid) IS NULL OR tr.company_id = CAST(:companyId AS uuid)) " +
                     "ORDER BY tr.recorded_at DESC", nativeQuery = true)
       List<TimeRecord> findTodayRecordsByEmployeeIdScoped(
                     @Param("employeeId") UUID employeeId,
                     @Param("companyId") UUID companyId);

       default List<TimeRecord> findTodayRecordsByEmployeeId(UUID employeeId) {
              return findTodayRecordsByEmployeeIdScoped(employeeId, TenantContext.get());
       }

       @Query(value = "SELECT * FROM time_records tr WHERE tr.employee_id = :employeeId " +
                     "AND (CAST(:companyId AS uuid) IS NULL OR tr.company_id = CAST(:companyId AS uuid)) " +
                     "ORDER BY tr.recorded_at DESC LIMIT 1", nativeQuery = true)
       Optional<TimeRecord> findLastRecordByEmployeeIdScoped(@Param("employeeId") UUID employeeId,
                     @Param("companyId") UUID companyId);

       default Optional<TimeRecord> findLastRecordByEmployeeId(UUID employeeId) {
              return findLastRecordByEmployeeIdScoped(employeeId, TenantContext.get());
       }

       @Query(value = "SELECT COUNT(*) FROM time_records tr WHERE tr.employee_id = :employeeId " +
                     "AND EXTRACT(YEAR FROM tr.recorded_at) = :year " +
                     "AND EXTRACT(MONTH FROM tr.recorded_at) = :month " +
                     "AND (CAST(:companyId AS uuid) IS NULL OR tr.company_id = CAST(:companyId AS uuid))", nativeQuery = true)
       Long countByEmployeeIdAndMonthYearScoped(
                     @Param("employeeId") UUID employeeId,
                     @Param("month") int month,
                     @Param("year") int year,
                     @Param("companyId") UUID companyId);

       default Long countByEmployeeIdAndMonthYear(UUID employeeId, int month, int year) {
              return countByEmployeeIdAndMonthYearScoped(employeeId, month, year, TenantContext.get());
       }

       Page<TimeRecord> findByStatusOrderByRecordedAtDesc(TimeRecord.RecordStatus status, Pageable pageable);

       @Query("SELECT tr FROM TimeRecord tr WHERE tr.status = :status ORDER BY tr.recordedAt DESC")
       List<TimeRecord> findListByStatus(@Param("status") TimeRecord.RecordStatus status);

       List<TimeRecord> findByRecordedAtBetweenOrderByRecordedAtDesc(LocalDateTime start, LocalDateTime end);

       long countByRecordedAtBetween(LocalDateTime start, LocalDateTime end);

       long countByStatus(TimeRecord.RecordStatus status);

       @Query("SELECT COUNT(tr) FROM TimeRecord tr WHERE tr.status = :status AND tr.recordedAt BETWEEN :start AND :end")
       long countByStatusAndRecordedAtBetween(@Param("status") TimeRecord.RecordStatus status,
               @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

       @Query("SELECT COUNT(DISTINCT tr.employee.id) FROM TimeRecord tr WHERE tr.recordedAt BETWEEN :start AND :end")
       long countDistinctEmployeeIdsByRecordedAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

       @Query("SELECT tr FROM TimeRecord tr JOIN tr.employee e WHERE e.department = :department " +
               "AND tr.recordedAt BETWEEN :start AND :end ORDER BY tr.recordedAt DESC")
       List<TimeRecord> findByEmployeeDepartmentAndPeriod(@Param("department") String department,
               @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

       // Time Control Module - Buscar registros por funcionário e data específica
       @Query(value = "SELECT * FROM time_records tr WHERE tr.employee_id = :employeeId " +
                     "AND CAST(tr.recorded_at AS date) = :date " +
                     "AND (CAST(:companyId AS uuid) IS NULL OR tr.company_id = CAST(:companyId AS uuid)) " +
                     "ORDER BY tr.recorded_at ASC", nativeQuery = true)
       List<TimeRecord> findByEmployeeIdAndDateScoped(
                     @Param("employeeId") UUID employeeId,
                     @Param("date") java.time.LocalDate date,
                     @Param("companyId") UUID companyId);

       default List<TimeRecord> findByEmployeeIdAndDate(UUID employeeId, java.time.LocalDate date) {
              return findByEmployeeIdAndDateScoped(employeeId, date, TenantContext.get());
       }
}
