package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.EquipmentMovement;
import com.z7design.fleet_manager.model.enums.MovementType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EquipmentMovementRepository extends JpaRepository<EquipmentMovement, UUID> {
    
    // Buscar histÃ³rico de um equipamento
    List<EquipmentMovement> findByEquipmentIdOrderByMovementDateDesc(UUID equipmentId);
    
    // Buscar movimentaÃ§Ãµes de um funcionÃ¡rio
    List<EquipmentMovement> findByEmployeeIdOrderByMovementDateDesc(UUID employeeId);
    
    // Buscar movimentaÃ§Ãµes por posto de trabalho
    List<EquipmentMovement> findByWorkPostIdOrderByMovementDateDesc(UUID workPostId);
    
    // Buscar movimentaÃ§Ãµes autorizadas por alguÃ©m
    List<EquipmentMovement> findByAuthorizedByIdOrderByMovementDateDesc(UUID authorizedById);
    
    // Buscar equipamentos nÃ£o devolvidos (em uso)
    @Query("SELECT em FROM EquipmentMovement em WHERE em.returned = false AND em.movementType IN ('WITHDRAWAL', 'PERMANENT_ASSIGNMENT', 'TEMPORARY_USE')")
    List<EquipmentMovement> findActiveWithdrawals();
    
    // Buscar Ãºltima movimentaÃ§Ã£o ativa de um equipamento
    @Query("SELECT em FROM EquipmentMovement em WHERE em.equipment.id = :equipmentId AND em.returned = false ORDER BY em.movementDate DESC")
    Optional<EquipmentMovement> findActiveMovementByEquipmentId(@Param("equipmentId") UUID equipmentId);
    
    // Buscar movimentaÃ§Ãµes em atraso
    @Query("SELECT em FROM EquipmentMovement em WHERE em.returned = false AND em.expectedReturnDate < :currentDate")
    List<EquipmentMovement> findOverdueMovements(@Param("currentDate") LocalDateTime currentDate);
    
    // Buscar movimentaÃ§Ãµes vencendo em X dias
    @Query("SELECT em FROM EquipmentMovement em WHERE em.returned = false AND em.expectedReturnDate BETWEEN :currentDate AND :futureDate")
    List<EquipmentMovement> findMovementsDueSoon(@Param("currentDate") LocalDateTime currentDate, 
                                                 @Param("futureDate") LocalDateTime futureDate);
    
    // Buscar por tipo de movimentaÃ§Ã£o
    List<EquipmentMovement> findByMovementTypeOrderByMovementDateDesc(MovementType movementType);
    
    // Buscar por perÃ­odo
    @Query("SELECT em FROM EquipmentMovement em WHERE em.movementDate BETWEEN :startDate AND :endDate ORDER BY em.movementDate DESC")
    List<EquipmentMovement> findByMovementDateBetween(@Param("startDate") LocalDateTime startDate, 
                                                      @Param("endDate") LocalDateTime endDate);
    
    // Contadores para dashboard
    @Query("SELECT COUNT(em) FROM EquipmentMovement em WHERE em.returned = false")
    Long countActiveMovements();
    
    @Query("SELECT COUNT(em) FROM EquipmentMovement em WHERE em.returned = false AND em.expectedReturnDate < :currentDate")
    Long countOverdueMovements(@Param("currentDate") LocalDateTime currentDate);
    
    @Query("SELECT COUNT(em) FROM EquipmentMovement em WHERE em.returned = false AND em.expectedReturnDate BETWEEN :currentDate AND :futureDate")
    Long countMovementsDueSoon(@Param("currentDate") LocalDateTime currentDate, 
                               @Param("futureDate") LocalDateTime futureDate);
    
    // RelatÃ³rios
    @Query("SELECT em.employee.name, COUNT(em) FROM EquipmentMovement em WHERE em.returned = false GROUP BY em.employee.name ORDER BY COUNT(em) DESC")
    List<Object[]> countActiveMovementsByEmployee();
    
    @Query("SELECT em.workPost.name, COUNT(em) FROM EquipmentMovement em WHERE em.returned = false AND em.workPost IS NOT NULL GROUP BY em.workPost.name ORDER BY COUNT(em) DESC")
    List<Object[]> countActiveMovementsByWorkPost();
    
    @Query("SELECT em.authorizedBy.name, COUNT(em) FROM EquipmentMovement em GROUP BY em.authorizedBy.name ORDER BY COUNT(em) DESC")
    List<Object[]> countMovementsByAuthorizer();
} 
