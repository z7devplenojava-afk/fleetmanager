package com.z7design.fleet_manager.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.z7design.fleet_manager.model.Dependent;

@Repository
public interface DependentRepository extends JpaRepository<Dependent, UUID> {
    List<Dependent> findByEmployeeId(UUID employeeId);
    List<Dependent> findByCpf(String cpf);
    List<Dependent> findByRelationship(String relationship);
} 
