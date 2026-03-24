package com.z7design.fleet_manager.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.z7design.fleet_manager.model.EmployeeCertification;
import com.z7design.fleet_manager.model.enums.CertificationStatus;

@Repository
public interface EmployeeCertificationRepository extends JpaRepository<EmployeeCertification, UUID> {
    
    /**
     * Busca todas as certificaÃ§Ãµes com relacionamentos carregados usando FETCH JOIN
     */
    @Query("SELECT DISTINCT ec FROM EmployeeCertification ec " +
           "LEFT JOIN FETCH ec.employee e " +
           "LEFT JOIN FETCH e.position p " +
           "LEFT JOIN FETCH e.unit u " +
           "LEFT JOIN FETCH ec.training t " +
           "LEFT JOIN FETCH ec.workPost wp")
    List<EmployeeCertification> findAllWithDetails();
    
    @Override
    @EntityGraph(attributePaths = {"employee", "employee.position", "employee.unit", "training", "workPost"})
    List<EmployeeCertification> findAll();

    @EntityGraph(attributePaths = {"employee", "employee.position", "employee.unit", "training", "workPost"})
    List<EmployeeCertification> findByEmployeeId(UUID employeeId);

    @EntityGraph(attributePaths = {"employee", "employee.position", "employee.unit", "training", "workPost"})
    List<EmployeeCertification> findByEmployeeIdAndStatus(UUID employeeId, CertificationStatus status);

    @EntityGraph(attributePaths = {"employee", "employee.position", "employee.unit", "training", "workPost"})
    List<EmployeeCertification> findByTrainingId(UUID trainingId);

    @EntityGraph(attributePaths = {"employee", "employee.position", "employee.unit", "training", "workPost"})
    List<EmployeeCertification> findByExpirationDateBefore(LocalDate date);

    @EntityGraph(attributePaths = {"employee", "employee.position", "employee.unit", "training", "workPost"})
    List<EmployeeCertification> findByExpirationDateBetween(LocalDate startDate, LocalDate endDate);

    @EntityGraph(attributePaths = {"employee", "employee.position", "employee.unit", "training", "workPost"})
    Optional<EmployeeCertification> findWithDetailsById(UUID id);
} 
