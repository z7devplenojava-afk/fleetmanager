package com.z7design.fleet_manager.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.z7design.fleet_manager.model.Occurrence;
import com.z7design.fleet_manager.model.OccurrenceType;

@Repository
public interface OccurrenceRepository extends JpaRepository<Occurrence, UUID> {
    
    List<Occurrence> findByEmployeeId(UUID employeeId);
    
    List<Occurrence> findByType(OccurrenceType type);
    
    List<Occurrence> findByStatus(String status);
    
    List<Occurrence> findByOccurrenceDateBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    List<Occurrence> findByEmployeeIdAndType(UUID employeeId, OccurrenceType type);
    
    List<Occurrence> findByEmployeeIdAndOccurrenceDateBetween(UUID employeeId, LocalDateTime startDate, LocalDateTime endDate);
} 
