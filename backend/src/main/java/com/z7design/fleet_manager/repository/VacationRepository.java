package com.z7design.fleet_manager.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.z7design.fleet_manager.model.Vacation;
import com.z7design.fleet_manager.model.enums.VacationStatus;

@Repository
public interface VacationRepository extends JpaRepository<Vacation, UUID> {
    List<Vacation> findByEmployeeId(UUID employeeId);
    List<Vacation> findByEmployeeIdAndStatus(UUID employeeId, VacationStatus status);
    List<Vacation> findByStartDateBetween(LocalDate startDate, LocalDate endDate);
    List<Vacation> findByStatus(VacationStatus status);
    long countByStatus(VacationStatus status);
    
    @Query("SELECT v FROM Vacation v LEFT JOIN FETCH v.employee LEFT JOIN FETCH v.approvedBy")
    List<Vacation> findAllWithEmployee();
    
    @Query("SELECT v FROM Vacation v LEFT JOIN FETCH v.employee LEFT JOIN FETCH v.approvedBy WHERE v.status = :status")
    List<Vacation> findByStatusWithEmployee(VacationStatus status);
} 
