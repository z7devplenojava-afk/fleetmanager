package br.com.fleetmanager.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.fleetmanager.model.Employee;
import br.com.fleetmanager.model.enums.EmploymentStatus;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    
    Optional<Employee> findByEmail(String email);
    
    List<Employee> findByStatus(EmploymentStatus status);
    
    List<Employee> findByUnitId(UUID unitId);
    
    List<Employee> findByPositionId(UUID positionId);
    
    boolean existsByEmail(String email);
    
    boolean existsByDocument(String document);
    
    Optional<Employee> findByDocument(String document);
    
    // Métodos para envio de holerites
    List<Employee> findByEmailIsNotNullAndEmailNot(String empty);
    
    // Busca por nome (case insensitive)
    List<Employee> findByNameContainingIgnoreCase(String name);
    
    // Busca por nome ou documento (case insensitive)
    List<Employee> findByNameContainingIgnoreCaseOrDocumentContainingIgnoreCase(String name, String document);
    
    // List<Employee> findByPossuiWhatsappTrue();
} 