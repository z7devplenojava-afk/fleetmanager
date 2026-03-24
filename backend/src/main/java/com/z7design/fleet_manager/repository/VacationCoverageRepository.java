package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.VacationCoverage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface VacationCoverageRepository extends JpaRepository<VacationCoverage, UUID> {
    
    List<VacationCoverage> findBySubstituteEmployeeId(UUID substituteEmployeeId);
    
    // VacationCoverage nÃ£o tem campo employee direto; employee estÃ¡ em Vacation
    List<VacationCoverage> findByVacationEmployeeId(UUID employeeId);
    
    List<VacationCoverage> findByStatus(VacationCoverage.CoverageStatus status);
    
    @Query("SELECT vc FROM VacationCoverage vc WHERE " +
           "(:startDate BETWEEN vc.coverageStartDate AND vc.coverageEndDate) OR " +
           "(:endDate BETWEEN vc.coverageStartDate AND vc.coverageEndDate) OR " +
           "(vc.coverageStartDate BETWEEN :startDate AND :endDate)")
    List<VacationCoverage> findByDateRange(@Param("startDate") LocalDate startDate, 
                                          @Param("endDate") LocalDate endDate);
    
    @Query("SELECT vc FROM VacationCoverage vc WHERE " +
           "vc.substituteEmployee.id = :employeeId AND " +
           "((:startDate BETWEEN vc.coverageStartDate AND vc.coverageEndDate) OR " +
           "(:endDate BETWEEN vc.coverageStartDate AND vc.coverageEndDate) OR " +
           "(vc.coverageStartDate BETWEEN :startDate AND :endDate))")
    List<VacationCoverage> findByEmployeeAndDateRange(@Param("employeeId") UUID employeeId,
                                                     @Param("startDate") LocalDate startDate,
                                                     @Param("endDate") LocalDate endDate);
    
    @Query("SELECT vc FROM VacationCoverage vc WHERE " +
           "vc.location.id = :locationId AND " +
           "((:startDate BETWEEN vc.coverageStartDate AND vc.coverageEndDate) OR " +
           "(:endDate BETWEEN vc.coverageStartDate AND vc.coverageEndDate) OR " +
           "(vc.coverageStartDate BETWEEN :startDate AND :endDate))")
    List<VacationCoverage> findByLocationAndDateRange(@Param("locationId") UUID locationId,
                                                     @Param("startDate") LocalDate startDate,
                                                     @Param("endDate") LocalDate endDate);
}

