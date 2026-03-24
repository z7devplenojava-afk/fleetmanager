package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Remanejamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RemanejamentoRepository extends JpaRepository<Remanejamento, UUID> {
    List<Remanejamento> findByEmployeeId(UUID employeeId);
    
    @Query("SELECT DISTINCT r FROM Remanejamento r " +
           "LEFT JOIN FETCH r.employee " +
           "LEFT JOIN FETCH r.originWorkstation " +
           "LEFT JOIN FETCH r.destinationWorkstation " +
           "ORDER BY r.dataRemanejamento DESC")
    List<Remanejamento> findAllWithEmployee();
    
    @Query("SELECT DISTINCT r FROM Remanejamento r " +
           "LEFT JOIN FETCH r.employee " +
           "LEFT JOIN FETCH r.originWorkstation " +
           "LEFT JOIN FETCH r.destinationWorkstation " +
           "WHERE r.employee.id = :employeeId " +
           "ORDER BY r.dataRemanejamento DESC")
    List<Remanejamento> findByEmployeeIdWithRelations(@org.springframework.data.repository.query.Param("employeeId") UUID employeeId);
    
    @Query("SELECT r FROM Remanejamento r " +
           "LEFT JOIN FETCH r.employee " +
           "LEFT JOIN FETCH r.originWorkstation " +
           "LEFT JOIN FETCH r.destinationWorkstation " +
           "WHERE r.id = :id")
    java.util.Optional<Remanejamento> findByIdWithRelations(@org.springframework.data.repository.query.Param("id") UUID id);
} 
