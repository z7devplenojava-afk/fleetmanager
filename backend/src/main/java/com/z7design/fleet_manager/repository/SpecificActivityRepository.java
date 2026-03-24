package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.SpecificActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface SpecificActivityRepository extends JpaRepository<SpecificActivity, UUID> {
    
    List<SpecificActivity> findByEmployeeId(UUID employeeId);
    
    List<SpecificActivity> findByLocationId(UUID locationId);
    
    List<SpecificActivity> findByActivityDate(LocalDate activityDate);
    
    List<SpecificActivity> findByStatus(SpecificActivity.ActivityStatus status);
    
    List<SpecificActivity> findByActivityType(SpecificActivity.ActivityType activityType);
    
    @Query("SELECT sa FROM SpecificActivity sa WHERE " +
           "sa.activityDate BETWEEN :startDate AND :endDate")
    List<SpecificActivity> findByDateRange(@Param("startDate") LocalDate startDate,
                                          @Param("endDate") LocalDate endDate);
    
    @Query("SELECT sa FROM SpecificActivity sa WHERE " +
           "sa.employee.id = :employeeId AND " +
           "sa.activityDate BETWEEN :startDate AND :endDate")
    List<SpecificActivity> findByEmployeeAndDateRange(@Param("employeeId") UUID employeeId,
                                                     @Param("startDate") LocalDate startDate,
                                                     @Param("endDate") LocalDate endDate);
    
    @Query("SELECT sa FROM SpecificActivity sa WHERE " +
           "sa.location.id = :locationId AND " +
           "sa.activityDate BETWEEN :startDate AND :endDate")
    List<SpecificActivity> findByLocationAndDateRange(@Param("locationId") UUID locationId,
                                                     @Param("startDate") LocalDate startDate,
                                                     @Param("endDate") LocalDate endDate);
    
    @Query("SELECT sa FROM SpecificActivity sa WHERE " +
           "sa.activityType = :activityType AND " +
           "sa.activityDate BETWEEN :startDate AND :endDate")
    List<SpecificActivity> findByActivityTypeAndDateRange(@Param("activityType") SpecificActivity.ActivityType activityType,
                                                         @Param("startDate") LocalDate startDate,
                                                         @Param("endDate") LocalDate endDate);
    
    @Query("SELECT sa FROM SpecificActivity sa WHERE " +
           "sa.activityDate = :date AND " +
           "sa.status IN ('SCHEDULED', 'IN_PROGRESS')")
    List<SpecificActivity> findPendingActivitiesByDate(@Param("date") LocalDate date);
    
    @Query("SELECT sa FROM SpecificActivity sa WHERE " +
           "sa.activityDate < :date AND " +
           "sa.status = 'SCHEDULED'")
    List<SpecificActivity> findOverdueActivities(@Param("date") LocalDate date);
}

