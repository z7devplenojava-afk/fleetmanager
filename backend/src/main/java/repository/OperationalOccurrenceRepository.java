package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.OperationalOccurrence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface OperationalOccurrenceRepository extends JpaRepository<OperationalOccurrence, UUID> {
    
    // Buscar ocorrências por funcionário
    List<OperationalOccurrence> findByEmployeeIdOrderByDateDesc(UUID employeeId);
    
    // Buscar ocorrências por tipo
    List<OperationalOccurrence> findByTypeOrderByDateDesc(OperationalOccurrence.OccurrenceType type);
    
    // Buscar ocorrências por status
    List<OperationalOccurrence> findByStatusOrderByDateDesc(OperationalOccurrence.OccurrenceStatus status);
    
    // Buscar ocorrências por prioridade
    List<OperationalOccurrence> findByPriorityOrderByDateDesc(OperationalOccurrence.OccurrencePriority priority);
    
    // Buscar ocorrências por período
    List<OperationalOccurrence> findByDateBetweenOrderByDateDesc(LocalDateTime startDate, LocalDateTime endDate);
    
    // Buscar ocorrências por funcionário e período
    List<OperationalOccurrence> findByEmployeeIdAndDateBetweenOrderByDateDesc(
        UUID employeeId, LocalDateTime startDate, LocalDateTime endDate);
    
    // Buscar ocorrências por tipo e período
    List<OperationalOccurrence> findByTypeAndDateBetweenOrderByDateDesc(
        OperationalOccurrence.OccurrenceType type, LocalDateTime startDate, LocalDateTime endDate);
    
    // Buscar ocorrências pendentes
    List<OperationalOccurrence> findByStatusOrderByPriorityDescDateAsc(OperationalOccurrence.OccurrenceStatus status);
    
    // Buscar ocorrências por responsável
    List<OperationalOccurrence> findByResponsibleOrderByDateDesc(String responsible);
    
    // Buscar ocorrências por local
    List<OperationalOccurrence> findByLocationContainingIgnoreCaseOrderByDateDesc(String location);
    
    // Contar ocorrências por funcionário e período
    @Query("SELECT COUNT(o) FROM OperationalOccurrence o WHERE o.employee.id = :employeeId AND o.date BETWEEN :startDate AND :endDate")
    long countByEmployeeAndPeriod(@Param("employeeId") UUID employeeId, 
                                  @Param("startDate") LocalDateTime startDate, 
                                  @Param("endDate") LocalDateTime endDate);
    
    // Contar ocorrências por tipo e período
    @Query("SELECT COUNT(o) FROM OperationalOccurrence o WHERE o.type = :type AND o.date BETWEEN :startDate AND :endDate")
    long countByTypeAndPeriod(@Param("type") OperationalOccurrence.OccurrenceType type,
                              @Param("startDate") LocalDateTime startDate, 
                              @Param("endDate") LocalDateTime endDate);
    
    // Buscar ocorrências por número de advertência
    OperationalOccurrence findByWarningNumber(Integer warningNumber);
    
    // Verificar se existe ocorrência com número de advertência
    boolean existsByWarningNumber(Integer warningNumber);
    
    // Buscar ocorrências não resolvidas por funcionário
    @Query("SELECT o FROM OperationalOccurrence o WHERE o.employee.id = :employeeId AND o.status NOT IN ('RESOLVIDO', 'CONCLUIDO') ORDER BY o.date DESC")
    List<OperationalOccurrence> findUnresolvedByEmployee(@Param("employeeId") UUID employeeId);
}
