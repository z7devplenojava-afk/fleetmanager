package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Supervisor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SupervisorRepository extends JpaRepository<Supervisor, UUID> {
    
    Optional<Supervisor> findByCpf(String cpf);
    
    Optional<Supervisor> findByEmail(String email);
    
    List<Supervisor> findByIsActiveTrue();
    
    List<Supervisor> findByIsActiveFalse();
    
    @Query("SELECT s FROM Supervisor s WHERE s.cpf = :cpf AND s.isActive = true")
    Optional<Supervisor> findActiveByCpf(@Param("cpf") String cpf);
    
    @Query("SELECT s FROM Supervisor s WHERE s.email = :email AND s.isActive = true")
    Optional<Supervisor> findActiveByEmail(@Param("email") String email);
    
    @Query("SELECT s FROM Supervisor s WHERE s.name LIKE %:name% AND s.isActive = true")
    List<Supervisor> findActiveByNameContaining(@Param("name") String name);
    
    boolean existsByCpf(String cpf);
    
    boolean existsByEmail(String email);
    
    @Query("SELECT COUNT(s) FROM Supervisor s WHERE s.isActive = true")
    long countActiveSupervisors();
}

