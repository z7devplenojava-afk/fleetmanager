package com.z7design.fleet_manager.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.z7design.fleet_manager.model.Department;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    
    /**
     * Busca departamentos ativos
     */
    List<Department> findByIsActiveTrue();
    
    /**
     * Busca por nome
     */
    List<Department> findByNameContainingIgnoreCase(String name);
    
    /**
     * Verifica se existe por nome
     */
    boolean existsByName(String name);
} 
