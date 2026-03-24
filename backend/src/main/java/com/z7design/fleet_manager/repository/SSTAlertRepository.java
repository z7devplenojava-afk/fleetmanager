package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.SSTAlert;
import com.z7design.fleet_manager.model.enums.SSTAlertType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * RepositÃ³rio para gerenciamento de alertas SST
 */
@Repository
public interface SSTAlertRepository extends JpaRepository<SSTAlert, UUID> {

    /**
     * Busca alertas por funcionÃ¡rio
     */
    List<SSTAlert> findByEmployee(Employee employee);

    /**
     * Busca alertas por ID do funcionÃ¡rio
     */
    @Query("SELECT a FROM SSTAlert a WHERE a.employee.id = :employeeId")
    List<SSTAlert> findByEmployeeId(@Param("employeeId") UUID employeeId);

    /**
     * Busca alertas por tipo
     */
    List<SSTAlert> findByAlertType(SSTAlertType alertType);

    /**
     * Busca alertas nÃ£o lidos
     */
    List<SSTAlert> findByIsReadFalse();

    /**
     * Busca alertas nÃ£o resolvidos
     */
    List<SSTAlert> findByIsResolvedFalse();

    /**
     * Busca alertas por prioridade
     */
    List<SSTAlert> findByPriority(Integer priority);

    /**
     * Busca alertas por funcionÃ¡rio e status de leitura
     */
    List<SSTAlert> findByEmployeeAndIsRead(Employee employee, Boolean isRead);

    /**
     * Busca alertas por funcionÃ¡rio e status de resoluÃ§Ã£o
     */
    List<SSTAlert> findByEmployeeAndIsResolved(Employee employee, Boolean isResolved);

    /**
     * Busca alertas vencidos
     */
    @Query("SELECT a FROM SSTAlert a WHERE a.dueDate <= :date AND a.isResolved = false")
    List<SSTAlert> findOverdueAlerts(@Param("date") LocalDate date);

    /**
     * Busca alertas prÃ³ximos do vencimento
     */
    @Query("SELECT a FROM SSTAlert a WHERE a.dueDate BETWEEN :startDate AND :endDate AND a.isResolved = false")
    List<SSTAlert> findAlertsDueSoon(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    /**
     * Busca alertas por tipo e status de resoluÃ§Ã£o
     */
    List<SSTAlert> findByAlertTypeAndIsResolved(SSTAlertType alertType, Boolean isResolved);

    /**
     * Busca alertas por prioridade e status de resoluÃ§Ã£o
     */
    List<SSTAlert> findByPriorityAndIsResolved(Integer priority, Boolean isResolved);

    /**
     * Conta alertas nÃ£o lidos por funcionÃ¡rio
     */
    @Query("SELECT COUNT(a) FROM SSTAlert a WHERE a.employee.id = :employeeId AND a.isRead = false")
    Long countUnreadAlertsByEmployee(@Param("employeeId") UUID employeeId);

    /**
     * Conta alertas nÃ£o resolvidos por funcionÃ¡rio
     */
    @Query("SELECT COUNT(a) FROM SSTAlert a WHERE a.employee.id = :employeeId AND a.isResolved = false")
    Long countUnresolvedAlertsByEmployee(@Param("employeeId") UUID employeeId);

    /**
     * Busca alertas por entidade relacionada
     */
    @Query("SELECT a FROM SSTAlert a WHERE a.relatedEntityType = :entityType AND a.relatedEntityId = :entityId")
    List<SSTAlert> findByRelatedEntity(@Param("entityType") String entityType, @Param("entityId") UUID entityId);
}

