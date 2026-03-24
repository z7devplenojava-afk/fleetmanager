package com.z7design.fleet_manager.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.z7design.fleet_manager.model.Benefit;

@Repository
public interface BenefitRepository extends JpaRepository<Benefit, UUID> {
    
    List<Benefit> findByEmployeeId(UUID employeeId);
    
    List<Benefit> findByPositionId(UUID positionId);
    
    List<Benefit> findByEndDateBefore(LocalDateTime date);
    
    List<Benefit> findByEmployeeIdAndPositionId(UUID employeeId, UUID positionId);
    
    List<Benefit> findByEndDateIsNull();
} 
