package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.WorkPostAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface WorkPostAssignmentRepository extends JpaRepository<WorkPostAssignment, UUID> {
    
    List<WorkPostAssignment> findByEmployeeId(UUID employeeId);
    
    List<WorkPostAssignment> findByWorkPostId(UUID workPostId);
    
    List<WorkPostAssignment> findByAssignmentDate(LocalDate assignmentDate);
    
    List<WorkPostAssignment> findByStatus(WorkPostAssignment.AssignmentStatus status);
    
    @Query("SELECT wpa FROM WorkPostAssignment wpa WHERE " +
           "wpa.employee.id = :employeeId AND " +
           "wpa.assignmentDate BETWEEN :startDate AND :endDate")
    List<WorkPostAssignment> findByEmployeeAndDateRange(@Param("employeeId") UUID employeeId,
                                                       @Param("startDate") LocalDate startDate,
                                                       @Param("endDate") LocalDate endDate);
    
    @Query("SELECT wpa FROM WorkPostAssignment wpa WHERE " +
           "wpa.workPost.id = :workPostId AND " +
           "wpa.assignmentDate BETWEEN :startDate AND :endDate")
    List<WorkPostAssignment> findByWorkPostAndDateRange(@Param("workPostId") UUID workPostId,
                                                       @Param("startDate") LocalDate startDate,
                                                       @Param("endDate") LocalDate endDate);
    
    @Query("SELECT wpa FROM WorkPostAssignment wpa WHERE " +
           "wpa.assignmentDate BETWEEN :startDate AND :endDate")
    List<WorkPostAssignment> findByDateRange(@Param("startDate") LocalDate startDate,
                                            @Param("endDate") LocalDate endDate);
    
    @Query("SELECT wpa FROM WorkPostAssignment wpa WHERE " +
           "wpa.assignmentDate = :date AND " +
           "wpa.workPost.id = :workPostId AND " +
           "wpa.status IN ('SCHEDULED', 'CONFIRMED')")
    List<WorkPostAssignment> findActiveAssignmentsByDateAndPost(@Param("date") LocalDate date,
                                                               @Param("workPostId") UUID workPostId);
    
    @Query("SELECT wpa FROM WorkPostAssignment wpa WHERE " +
           "wpa.assignmentDate = :date AND " +
           "wpa.employee.id = :employeeId AND " +
           "wpa.status IN ('SCHEDULED', 'CONFIRMED')")
    List<WorkPostAssignment> findActiveAssignmentsByDateAndEmployee(@Param("date") LocalDate date,
                                                                   @Param("employeeId") UUID employeeId);
}

