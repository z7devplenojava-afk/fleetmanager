package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Absence;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface AbsenceRepository extends JpaRepository<Absence, UUID> {
    
    @EntityGraph(attributePaths = {"employee", "coverageEmployee", "approvedBy"})
    @Query("SELECT a FROM Absence a")
    List<Absence> findAllWithRelationships();
    
    @EntityGraph(attributePaths = {"employee", "coverageEmployee", "approvedBy"})
    @Query("SELECT a FROM Absence a WHERE a.id = :id")
    java.util.Optional<Absence> findByIdWithRelationships(@Param("id") UUID id);
    
    @EntityGraph(attributePaths = {"employee", "coverageEmployee", "approvedBy"})
    @Query("SELECT a FROM Absence a WHERE a.employee.id = :employeeId")
    List<Absence> findByEmployeeId(@Param("employeeId") UUID employeeId);
    
    @EntityGraph(attributePaths = {"employee", "coverageEmployee", "approvedBy"})
    @Query("SELECT a FROM Absence a WHERE a.absenceDate = :absenceDate")
    List<Absence> findByAbsenceDate(@Param("absenceDate") LocalDate absenceDate);
    
    @EntityGraph(attributePaths = {"employee", "coverageEmployee", "approvedBy"})
    @Query("SELECT a FROM Absence a WHERE a.status = :status")
    List<Absence> findByStatus(@Param("status") Absence.AbsenceStatus status);
    
    @EntityGraph(attributePaths = {"employee", "coverageEmployee", "approvedBy"})
    @Query("SELECT a FROM Absence a WHERE a.absenceType = :absenceType")
    List<Absence> findByAbsenceType(@Param("absenceType") Absence.AbsenceType absenceType);
    
    @EntityGraph(attributePaths = {"employee", "coverageEmployee", "approvedBy"})
    @Query("SELECT a FROM Absence a WHERE a.employee.id = :employeeId AND " +
           "a.absenceDate BETWEEN :startDate AND :endDate")
    List<Absence> findByEmployeeAndDateRange(@Param("employeeId") UUID employeeId,
                                            @Param("startDate") LocalDate startDate,
                                            @Param("endDate") LocalDate endDate);
    
    @EntityGraph(attributePaths = {"employee", "coverageEmployee", "approvedBy"})
    @Query("SELECT a FROM Absence a WHERE a.absenceDate BETWEEN :startDate AND :endDate")
    List<Absence> findByDateRange(@Param("startDate") LocalDate startDate,
                                 @Param("endDate") LocalDate endDate);
    
    @Query("SELECT a FROM Absence a WHERE " +
           "a.absenceDate BETWEEN :startDate AND :endDate AND " +
           "a.status = :status")
    List<Absence> findByDateRangeAndStatus(@Param("startDate") LocalDate startDate,
                                          @Param("endDate") LocalDate endDate,
                                          @Param("status") Absence.AbsenceStatus status);
    
    @Query("SELECT COUNT(a) FROM Absence a WHERE " +
           "a.employee.id = :employeeId AND " +
           "a.absenceDate BETWEEN :startDate AND :endDate AND " +
           "a.status IN ('APPROVED', 'COVERED')")
    Long countApprovedAbsencesByEmployeeAndDateRange(@Param("employeeId") UUID employeeId,
                                                    @Param("startDate") LocalDate startDate,
                                                    @Param("endDate") LocalDate endDate);
    
    long countByStatus(Absence.AbsenceStatus status);
}

