package com.z7design.fleet_manager.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.z7design.fleet_manager.model.SupportAgent;
import com.z7design.fleet_manager.model.enums.AgentStatus;

@Repository
public interface SupportAgentRepository extends JpaRepository<SupportAgent, UUID> {
    
    /**
     * Busca agente por ID do usuÃ¡rio
     */
    Optional<SupportAgent> findByUserId(UUID userId);
    
    /**
     * Busca agentes por status
     */
    List<SupportAgent> findByStatus(AgentStatus status);
    
    /**
     * Busca agentes ativos
     */
    List<SupportAgent> findByActiveTrue();
    
    /**
     * Busca agentes por departamento
     */
    List<SupportAgent> findByDepartment(String department);
    
    /**
     * Busca agentes ativos por status
     */
    List<SupportAgent> findByActiveTrueAndStatus(AgentStatus status);
    
    /**
     * Busca agentes com menor carga de trabalho
     */
    @Query("SELECT sa FROM SupportAgent sa WHERE sa.active = true AND sa.status = 'ONLINE' ORDER BY (sa.totalTickets - sa.resolvedTickets) ASC")
    List<SupportAgent> findAvailableAgentsOrderByWorkload();
    
    /**
     * Conta agentes por status
     */
    @Query("SELECT COUNT(sa) FROM SupportAgent sa WHERE sa.status = :status AND sa.active = true")
    Long countByStatusAndActiveTrue(@Param("status") AgentStatus status);
}


