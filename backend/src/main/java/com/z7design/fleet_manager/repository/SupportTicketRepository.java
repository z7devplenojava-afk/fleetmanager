package com.z7design.fleet_manager.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.z7design.fleet_manager.model.SupportTicket;
import com.z7design.fleet_manager.model.enums.TicketStatus;
import com.z7design.fleet_manager.model.enums.TicketPriority;
import com.z7design.fleet_manager.model.enums.TicketCategory;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, UUID> {
    
    /**
     * Busca tickets por status
     */
    Page<SupportTicket> findByStatus(TicketStatus status, Pageable pageable);
    
    /**
     * Busca tickets por prioridade
     */
    Page<SupportTicket> findByPriority(TicketPriority priority, Pageable pageable);
    
    /**
     * Busca tickets por categoria
     */
    Page<SupportTicket> findByCategory(TicketCategory category, Pageable pageable);
    
    /**
     * Busca tickets atribuÃ­dos a um agente
     */
    Page<SupportTicket> findByAssignedToId(UUID agentId, Pageable pageable);
    
    /**
     * Busca tickets por email do cliente
     */
    Page<SupportTicket> findByCustomerEmail(String email, Pageable pageable);
    
    /**
     * Busca tickets por empresa
     */
    Page<SupportTicket> findByCompanyId(UUID companyId, Pageable pageable);
    
    /**
     * Busca tickets criados em um perÃ­odo
     */
    @Query("SELECT st FROM SupportTicket st WHERE st.createdAt BETWEEN :start AND :end ORDER BY st.createdAt DESC")
    List<SupportTicket> findByCreatedAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    /**
     * Busca tickets por mÃºltiplos critÃ©rios
     */
    @Query("SELECT st FROM SupportTicket st WHERE " +
           "(:status IS NULL OR st.status = :status) AND " +
           "(:priority IS NULL OR st.priority = :priority) AND " +
           "(:category IS NULL OR st.category = :category) AND " +
           "(:agentId IS NULL OR st.assignedTo.id = :agentId) " +
           "ORDER BY st.createdAt DESC")
    Page<SupportTicket> findByFilters(
        @Param("status") TicketStatus status,
        @Param("priority") TicketPriority priority,
        @Param("category") TicketCategory category,
        @Param("agentId") UUID agentId,
        Pageable pageable
    );
    
    /**
     * Busca por texto no tÃ­tulo ou descriÃ§Ã£o
     */
    @Query("SELECT st FROM SupportTicket st WHERE " +
           "LOWER(st.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(st.description) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(st.customerName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(st.customerEmail) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<SupportTicket> searchTickets(@Param("search") String search, Pageable pageable);
    
    /**
     * Conta tickets por status
     */
    Long countByStatus(TicketStatus status);
    
    /**
     * Conta tickets abertos
     */
    @Query("SELECT COUNT(st) FROM SupportTicket st WHERE st.status IN ('OPEN', 'IN_PROGRESS')")
    Long countOpenTickets();
    
    /**
     * Calcula tempo mÃ©dio de resoluÃ§Ã£o (em horas)
     */
    @Query(value = "SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600.0) FROM support_tickets WHERE resolved_at IS NOT NULL", nativeQuery = true)
    Double getAverageResolutionTime();
    
    /**
     * Taxa de resoluÃ§Ã£o (tickets resolvidos / total)
     */
    @Query(value = "SELECT (COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) " +
           "FROM support_tickets WHERE created_at >= :since", nativeQuery = true)
    Double getResolutionRate(@Param("since") LocalDateTime since);
}


