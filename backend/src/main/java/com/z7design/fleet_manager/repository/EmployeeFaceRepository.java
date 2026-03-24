package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.EmployeeFace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeFaceRepository extends JpaRepository<EmployeeFace, UUID> {
    
    Optional<EmployeeFace> findByCpf(String cpf);
    
    Optional<EmployeeFace> findByEmployeeId(UUID employeeId);
    
    List<EmployeeFace> findByIsActiveTrue();
    
    List<EmployeeFace> findByEmployeeIdAndIsActiveTrue(UUID employeeId);
    
    @Query("SELECT ef FROM EmployeeFace ef WHERE ef.cpf = :cpf AND ef.isActive = true")
    Optional<EmployeeFace> findActiveByCpf(@Param("cpf") String cpf);
    
    @Query("SELECT ef FROM EmployeeFace ef WHERE ef.employeeId = :employeeId AND ef.isActive = true")
    List<EmployeeFace> findActiveByEmployeeId(@Param("employeeId") UUID employeeId);
    
    boolean existsByCpf(String cpf);
    
    boolean existsByEmployeeId(UUID employeeId);
    
    @Query("SELECT COUNT(ef) FROM EmployeeFace ef WHERE ef.employeeId = :employeeId AND ef.isActive = true")
    long countActiveByEmployeeId(@Param("employeeId") UUID employeeId);
}

