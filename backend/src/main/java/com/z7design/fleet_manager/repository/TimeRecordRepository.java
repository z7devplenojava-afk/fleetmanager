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

    @Query("SELECT tr FROM TimeRecord tr LEFT JOIN FETCH tr.employee e LEFT JOIN FETCH tr.workPost wp " +
           "WHERE tr.employee.id = :employeeId " +
           "AND tr.recordedAt >= :start AND tr.recordedAt <= :end " +
           "ORDER BY tr.recordedAt ASC")
    List<TimeRecord> findByEmployeeIdAndRecordedAtBetweenOrderByRecordedAtAsc(
            @Param("employeeId") UUID employeeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    Page<TimeRecord> findByEmployeeIdOrderByRecordedAtDesc(UUID employeeId, Pageable pageable);

    Page<TimeRecord> findByWorkPostIdOrderByRecordedAtDesc(UUID workPostId, Pageable pageable);

    @Query("SELECT tr FROM TimeRecord tr LEFT JOIN FETCH tr.employee e LEFT JOIN FETCH tr.workPost wp " +
           "WHERE tr.employee.id = :employeeId " +
           "AND tr.recordedAt >= :startOfDay AND tr.recordedAt <= :endOfDay " +
           "ORDER BY tr.recordedAt DESC")
    List<TimeRecord> findTodayRecordsByEmployeeId(
            @Param("employeeId") UUID employeeId,
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay);

    default List<TimeRecord> findTodayRecordsByEmployeeId(UUID employeeId) {
        java.time.LocalDate today = java.time.LocalDate.now();
        return findTodayRecordsByEmployeeId(employeeId, today.atStartOfDay(), today.atTime(java.time.LocalTime.MAX));
    }

    @Query("SELECT tr FROM TimeRecord tr LEFT JOIN FETCH tr.employee e LEFT JOIN FETCH tr.workPost wp " +
           "WHERE tr.employee.id = :employeeId ORDER BY tr.recordedAt DESC")
    List<TimeRecord> findLastRecordsByEmployeeIdPaged(@Param("employeeId") UUID employeeId, Pageable pageable);

    default Optional<TimeRecord> findLastRecordByEmployeeId(UUID employeeId) {
        List<TimeRecord> list = findLastRecordsByEmployeeIdPaged(employeeId, org.springframework.data.domain.PageRequest.of(0, 1));
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    @Query("SELECT COUNT(tr) FROM TimeRecord tr WHERE tr.employee.id = :employeeId " +
           "AND tr.recordedAt >= :start AND tr.recordedAt <= :end")
    Long countByEmployeeIdAndRecordedAtBetween(
            @Param("employeeId") UUID employeeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    default Long countByEmployeeIdAndMonthYear(UUID employeeId, int month, int year) {
        java.time.YearMonth ym = java.time.YearMonth.of(year, month);
        LocalDateTime start = ym.atDay(1).atStartOfDay();
        LocalDateTime end = ym.atEndOfMonth().atTime(java.time.LocalTime.MAX);
        return countByEmployeeIdAndRecordedAtBetween(employeeId, start, end);
    }

    Page<TimeRecord> findByStatusOrderByRecordedAtDesc(TimeRecord.RecordStatus status, Pageable pageable);

    @Query("SELECT tr FROM TimeRecord tr LEFT JOIN FETCH tr.employee e LEFT JOIN FETCH tr.workPost wp " +
           "WHERE tr.status = :status ORDER BY tr.recordedAt DESC")
    List<TimeRecord> findListByStatus(@Param("status") TimeRecord.RecordStatus status);

    List<TimeRecord> findByRecordedAtBetweenOrderByRecordedAtDesc(LocalDateTime start, LocalDateTime end);

    long countByRecordedAtBetween(LocalDateTime start, LocalDateTime end);

    long countByStatus(TimeRecord.RecordStatus status);

    @Query("SELECT COUNT(tr) FROM TimeRecord tr WHERE tr.status = :status AND tr.recordedAt BETWEEN :start AND :end")
    long countByStatusAndRecordedAtBetween(@Param("status") TimeRecord.RecordStatus status,
            @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(DISTINCT tr.employee.id) FROM TimeRecord tr WHERE tr.recordedAt BETWEEN :start AND :end")
    long countDistinctEmployeeIdsByRecordedAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT tr FROM TimeRecord tr JOIN tr.employee e WHERE e.department.name = :department " +
            "AND tr.recordedAt BETWEEN :start AND :end ORDER BY tr.recordedAt DESC")
    List<TimeRecord> findByEmployeeDepartmentAndPeriod(@Param("department") String department,
            @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    default List<TimeRecord> findByEmployeeIdAndDate(UUID employeeId, java.time.LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(java.time.LocalTime.MAX);
        return findByEmployeeIdAndRecordedAtBetweenOrderByRecordedAtAsc(employeeId, start, end);
    }
}
