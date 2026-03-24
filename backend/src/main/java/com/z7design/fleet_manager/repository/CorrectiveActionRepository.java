package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.CorrectiveAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * RepositÃ³rio para gerenciamento de aÃ§Ãµes corretivas
 */
@Repository
public interface CorrectiveActionRepository extends JpaRepository<CorrectiveAction, UUID> {

    /**
     * Busca aÃ§Ãµes por status
     */
    List<CorrectiveAction> findByStatus(String status);

    /**
     * Busca aÃ§Ãµes por prioridade
     */
    List<CorrectiveAction> findByPriority(String priority);

    /**
     * Busca aÃ§Ãµes por origem
     */
    List<CorrectiveAction> findByOrigin(String origin);

    /**
     * Busca aÃ§Ãµes por responsÃ¡vel
     */
    @Query("SELECT ca FROM CorrectiveAction ca WHERE ca.responsibleUser.id = :userId OR ca.responsibleName = :name")
    List<CorrectiveAction> findByResponsible(@Param("userId") UUID userId, @Param("name") String name);

    /**
     * Busca aÃ§Ãµes vencidas
     */
    @Query("SELECT ca FROM CorrectiveAction ca WHERE ca.dueDate < :date AND ca.status NOT IN ('CONCLUIDA', 'CANCELADA')")
    List<CorrectiveAction> findOverdueActions(@Param("date") LocalDate date);

    /**
     * Busca aÃ§Ãµes prÃ³ximas do vencimento
     */
    @Query("SELECT ca FROM CorrectiveAction ca WHERE ca.dueDate BETWEEN :today AND :futureDate AND ca.status NOT IN ('CONCLUIDA', 'CANCELADA')")
    List<CorrectiveAction> findActionsDueSoon(@Param("today") LocalDate today, @Param("futureDate") LocalDate futureDate);

    /**
     * Busca aÃ§Ãµes pendentes
     */
    @Query("SELECT ca FROM CorrectiveAction ca WHERE ca.status IN ('PENDENTE', 'EM_ANDAMENTO')")
    List<CorrectiveAction> findPendingActions();
}





