package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Schedule;
import com.z7design.fleet_manager.tenant.TenantContext;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, UUID> {
    List<Schedule> findByScheduleDateBetween(LocalDate startDate, LocalDate endDate);

    List<Schedule> findByEmployeeId(UUID employeeId);

    List<Schedule> findByScheduleDate(LocalDate date);

    @Query("SELECT DISTINCT s FROM Schedule s " +
            "LEFT JOIN FETCH s.employee " +
            "LEFT JOIN FETCH s.location " +
            "LEFT JOIN FETCH s.workPost wp " +
            "LEFT JOIN FETCH wp.client " +
            "LEFT JOIN FETCH s.travelTrip tt " +
            "LEFT JOIN FETCH tt.client " +
            "LEFT JOIN FETCH s.route " +
            "LEFT JOIN FETCH s.vehicle " +
            "LEFT JOIN FETCH s.patrol")
    List<Schedule> findAllWithRelations();

    @Query("SELECT DISTINCT s FROM Schedule s " +
            "LEFT JOIN FETCH s.employee e " +
            "LEFT JOIN FETCH s.location " +
            "LEFT JOIN FETCH s.workPost wp " +
            "LEFT JOIN FETCH wp.client " +
            "LEFT JOIN FETCH s.travelTrip tt " +
            "LEFT JOIN FETCH tt.client " +
            "LEFT JOIN FETCH s.route " +
            "LEFT JOIN FETCH s.vehicle " +
            "LEFT JOIN FETCH s.patrol " +
            "WHERE e.id IN :employeeIds OR UPPER(TRIM(e.name)) = UPPER(TRIM(:employeeName))")
    List<Schedule> findByEmployeeIdsOrNameWithRelations(
            @Param("employeeIds") List<UUID> employeeIds,
            @Param("employeeName") String employeeName);

    @Modifying
    @Query(value = "DELETE FROM schedules WHERE id = :id " +
            "AND (CAST(:companyId AS uuid) IS NULL OR company_id = CAST(:companyId AS uuid))", nativeQuery = true)
    void deleteByIdNativeScoped(@Param("id") UUID id, @Param("companyId") UUID companyId);

    default void deleteByIdNative(UUID id) {
        deleteByIdNativeScoped(id, TenantContext.get());
    }
}
