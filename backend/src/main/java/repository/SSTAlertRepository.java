package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.Employee;
import br.com.fleetmanager.model.SSTAlert;
import br.com.fleetmanager.model.enums.SSTAlertType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Repositório para gerenciamento de alertas SST
 */
@Repository
public interface SSTAlertRepository extends JpaRepository<SSTAlert, UUID> {

    /**
     * Busca alertas por funcionário
     */
    List<SSTAlert> findByEmployee(Employee employee);

    /**
     * Busca alertas por ID do funcionário
     */
    @Query("SELECT a FROM SSTAlert a WHERE a.employee.id = :employeeId")
    List<SSTAlert> findByEmployeeId(@Param("employeeId") UUID employeeId);

    /**
     * Busca alertas por tipo
     */
    List<SSTAlert> findByAlertType(SSTAlertType alertType);

    /**
     * Busca alertas não lidos
     */
    List<SSTAlert> findByIsReadFalse();

    /**
     * Busca alertas não resolvidos
     */
    List<SSTAlert> findByIsResolvedFalse();

    /**
     * Busca alertas por prioridade
     */
    List<SSTAlert> findByPriority(Integer priority);

    /**
     * Busca alertas por funcionário e status de leitura
     */
    List<SSTAlert> findByEmployeeAndIsRead(Employee employee, Boolean isRead);

    /**
     * Busca alertas por funcionário e status de resolução
     */
    List<SSTAlert> findByEmployeeAndIsResolved(Employee employee, Boolean isResolved);

    /**
     * Busca alertas vencidos
     */
    @Query("SELECT a FROM SSTAlert a WHERE a.dueDate <= :date AND a.isResolved = false")
    List<SSTAlert> findOverdueAlerts(@Param("date") LocalDate date);

    /**
     * Busca alertas próximos do vencimento
     */
    @Query("SELECT a FROM SSTAlert a WHERE a.dueDate BETWEEN :startDate AND :endDate AND a.isResolved = false")
    List<SSTAlert> findAlertsDueSoon(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    /**
     * Busca alertas por tipo e status de resolução
     */
    List<SSTAlert> findByAlertTypeAndIsResolved(SSTAlertType alertType, Boolean isResolved);

    /**
     * Busca alertas por prioridade e status de resolução
     */
    List<SSTAlert> findByPriorityAndIsResolved(Integer priority, Boolean isResolved);

    /**
     * Conta alertas não lidos por funcionário
     */
    @Query("SELECT COUNT(a) FROM SSTAlert a WHERE a.employee.id = :employeeId AND a.isRead = false")
    Long countUnreadAlertsByEmployee(@Param("employeeId") UUID employeeId);

    /**
     * Conta alertas não resolvidos por funcionário
     */
    @Query("SELECT COUNT(a) FROM SSTAlert a WHERE a.employee.id = :employeeId AND a.isResolved = false")
    Long countUnresolvedAlertsByEmployee(@Param("employeeId") UUID employeeId);

    /**
     * Busca alertas por entidade relacionada
     */
    @Query("SELECT a FROM SSTAlert a WHERE a.relatedEntityType = :entityType AND a.relatedEntityId = :entityId")
    List<SSTAlert> findByRelatedEntity(@Param("entityType") String entityType, @Param("entityId") UUID entityId);
}
