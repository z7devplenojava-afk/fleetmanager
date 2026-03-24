package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.OperationalOccurrence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface OperationalOccurrenceRepository extends JpaRepository<OperationalOccurrence, UUID> {
    
    @Query("SELECT DISTINCT o FROM OperationalOccurrence o LEFT JOIN FETCH o.employee")
    List<OperationalOccurrence> findAllWithRelationships();
    
    // Buscar ocorrÃªncias por funcionÃ¡rio
    @Query("SELECT DISTINCT o FROM OperationalOccurrence o LEFT JOIN FETCH o.employee WHERE o.employee.id = :employeeId ORDER BY o.date DESC")
    List<OperationalOccurrence> findByEmployeeIdOrderByDateDesc(@Param("employeeId") UUID employeeId);
    
    // Buscar ocorrÃªncias por tipo
    @Query("SELECT DISTINCT o FROM OperationalOccurrence o LEFT JOIN FETCH o.employee WHERE o.type = :type ORDER BY o.date DESC")
    List<OperationalOccurrence> findByTypeOrderByDateDesc(@Param("type") OperationalOccurrence.OccurrenceType type);
    
    // Buscar ocorrÃªncias por status
    @Query("SELECT DISTINCT o FROM OperationalOccurrence o LEFT JOIN FETCH o.employee WHERE o.status = :status ORDER BY o.date DESC")
    List<OperationalOccurrence> findByStatusOrderByDateDesc(@Param("status") OperationalOccurrence.OccurrenceStatus status);
    
    // Buscar ocorrÃªncias por prioridade
    @Query("SELECT DISTINCT o FROM OperationalOccurrence o LEFT JOIN FETCH o.employee WHERE o.priority = :priority ORDER BY o.date DESC")
    List<OperationalOccurrence> findByPriorityOrderByDateDesc(@Param("priority") OperationalOccurrence.OccurrencePriority priority);
    
    // Buscar ocorrÃªncias por perÃ­odo
    @Query("SELECT DISTINCT o FROM OperationalOccurrence o LEFT JOIN FETCH o.employee WHERE o.date BETWEEN :startDate AND :endDate ORDER BY o.date DESC")
    List<OperationalOccurrence> findByDateBetweenOrderByDateDesc(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // Buscar ocorrÃªncias por funcionÃ¡rio e perÃ­odo
    @Query("SELECT DISTINCT o FROM OperationalOccurrence o LEFT JOIN FETCH o.employee WHERE o.employee.id = :employeeId AND o.date BETWEEN :startDate AND :endDate ORDER BY o.date DESC")
    List<OperationalOccurrence> findByEmployeeIdAndDateBetweenOrderByDateDesc(
        @Param("employeeId") UUID employeeId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // Buscar ocorrÃªncias por tipo e perÃ­odo
    @Query("SELECT DISTINCT o FROM OperationalOccurrence o LEFT JOIN FETCH o.employee WHERE o.type = :type AND o.date BETWEEN :startDate AND :endDate ORDER BY o.date DESC")
    List<OperationalOccurrence> findByTypeAndDateBetweenOrderByDateDesc(
        @Param("type") OperationalOccurrence.OccurrenceType type, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // Buscar ocorrÃªncias pendentes
    @Query("SELECT DISTINCT o FROM OperationalOccurrence o LEFT JOIN FETCH o.employee WHERE o.status = :status ORDER BY o.priority DESC, o.date ASC")
    List<OperationalOccurrence> findByStatusOrderByPriorityDescDateAsc(@Param("status") OperationalOccurrence.OccurrenceStatus status);
    
    // Buscar ocorrÃªncias por responsÃ¡vel
    @Query("SELECT DISTINCT o FROM OperationalOccurrence o LEFT JOIN FETCH o.employee WHERE o.responsible = :responsible ORDER BY o.date DESC")
    List<OperationalOccurrence> findByResponsibleOrderByDateDesc(@Param("responsible") String responsible);
    
    // Buscar ocorrÃªncias por local
    @Query("SELECT DISTINCT o FROM OperationalOccurrence o LEFT JOIN FETCH o.employee WHERE LOWER(o.location) LIKE LOWER(CONCAT('%', :location, '%')) ORDER BY o.date DESC")
    List<OperationalOccurrence> findByLocationContainingIgnoreCaseOrderByDateDesc(@Param("location") String location);
    
    // Contar ocorrÃªncias por funcionÃ¡rio e perÃ­odo
    @Query("SELECT COUNT(o) FROM OperationalOccurrence o WHERE o.employee.id = :employeeId AND o.date BETWEEN :startDate AND :endDate")
    long countByEmployeeAndPeriod(@Param("employeeId") UUID employeeId, 
                                  @Param("startDate") LocalDateTime startDate, 
                                  @Param("endDate") LocalDateTime endDate);
    
    // Contar ocorrÃªncias por tipo e perÃ­odo
    @Query("SELECT COUNT(o) FROM OperationalOccurrence o WHERE o.type = :type AND o.date BETWEEN :startDate AND :endDate")
    long countByTypeAndPeriod(@Param("type") OperationalOccurrence.OccurrenceType type,
                              @Param("startDate") LocalDateTime startDate, 
                              @Param("endDate") LocalDateTime endDate);
    
    // Buscar ocorrÃªncias por nÃºmero de advertÃªncia
    OperationalOccurrence findByWarningNumber(Integer warningNumber);
    
    // Verificar se existe ocorrÃªncia com nÃºmero de advertÃªncia
    boolean existsByWarningNumber(Integer warningNumber);
    
    // Buscar ocorrÃªncias nÃ£o resolvidas por funcionÃ¡rio
    @Query("SELECT o FROM OperationalOccurrence o WHERE o.employee.id = :employeeId AND o.status NOT IN ('RESOLVIDO', 'CONCLUIDO') ORDER BY o.date DESC")
    List<OperationalOccurrence> findUnresolvedByEmployee(@Param("employeeId") UUID employeeId);
}

