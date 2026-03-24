package com.z7design.fleet_manager.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.z7design.fleet_manager.model.Payroll;

@Repository
public interface PayrollRepository extends JpaRepository<Payroll, UUID> {
    
    List<Payroll> findByEmployeeId(UUID employeeId);
    
    List<Payroll> findByUnitId(UUID unitId);
    
    List<Payroll> findByReferenceMonth(String referenceMonth);
    
    List<Payroll> findByEmployeeIdAndReferenceMonth(UUID employeeId, String referenceMonth);
    
    List<Payroll> findByUnitIdAndReferenceMonth(UUID unitId, String referenceMonth);
    
    List<Payroll> findByReferenceMonthStartingWith(String year);
    
    @Query("SELECT p FROM Payroll p WHERE p.referenceMonth BETWEEN :startDate AND :endDate")
    List<Payroll> findByDateBetween(@Param("startDate") String startDate, @Param("endDate") String endDate);
    
    @Query("SELECT p FROM Payroll p WHERE p.referenceMonth LIKE '%' || :month")
    List<Payroll> findByMonth(@Param("month") String month);
    
    @Query("SELECT p FROM Payroll p WHERE p.referenceMonth LIKE :year || '%'")
    List<Payroll> findByYear(@Param("year") Integer year);

    @Query("SELECT COALESCE(SUM(p.netSalary), 0) FROM Payroll p WHERE p.referenceMonth = :referenceMonth")
    Double sumNetSalaryByReferenceMonth(@Param("referenceMonth") String referenceMonth);
} 
