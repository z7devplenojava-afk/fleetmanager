package com.z7design.fleet_manager.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.z7design.fleet_manager.model.TicketMessage;

@Repository
public interface TicketMessageRepository extends JpaRepository<TicketMessage, UUID> {
    
    /**
     * Busca mensagens de um ticket
     */
    List<TicketMessage> findByTicketIdOrderByCreatedAtAsc(UUID ticketId);
    
    /**
     * Busca mensagens de um agente
     */
    List<TicketMessage> findByAgentIdOrderByCreatedAtDesc(UUID agentId);
    
    /**
     * Busca mensagens do suporte
     */
    List<TicketMessage> findByIsSupportTrueOrderByCreatedAtDesc();
    
    /**
     * Conta mensagens de um ticket
     */
    Long countByTicketId(UUID ticketId);
    
    /**
     * Busca Ãºltima mensagem de um ticket
     */
    @Query("SELECT tm FROM TicketMessage tm WHERE tm.ticket.id = :ticketId ORDER BY tm.createdAt DESC LIMIT 1")
    TicketMessage findLastMessageByTicketId(@Param("ticketId") UUID ticketId);
}


