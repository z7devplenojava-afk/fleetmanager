package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Proposal;
import com.z7design.fleet_manager.model.enums.ProposalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ProposalRepository extends JpaRepository<Proposal, UUID> {
    
    // Buscar propostas por status
    List<Proposal> findByStatus(ProposalStatus status);
    
    // Buscar propostas por status com paginaÃ§Ã£o
    Page<Proposal> findByStatus(ProposalStatus status, Pageable pageable);
    
    // Buscar propostas por cliente
    List<Proposal> findByClientId(UUID clientId);
    
    // Buscar propostas por lead
    List<Proposal> findByLeadId(UUID leadId);
    
    // Buscar propostas por responsÃ¡vel
    List<Proposal> findByAssignedToId(UUID assignedToId);
    
    // Buscar propostas por criador
    List<Proposal> findByCreatedById(UUID createdById);
    
    // Buscar propostas por nÃºmero
    List<Proposal> findByProposalNumberContaining(String proposalNumber);
    
    // Buscar propostas por tÃ­tulo
    List<Proposal> findByTitleContainingIgnoreCase(String title);
    
    // Buscar propostas que expiram em uma data
    @Query("SELECT p FROM Proposal p WHERE p.validUntil = :date")
    List<Proposal> findByValidUntil(@Param("date") LocalDate date);
    
    // Buscar propostas que expiram em um perÃ­odo
    @Query("SELECT p FROM Proposal p WHERE p.validUntil BETWEEN :startDate AND :endDate")
    List<Proposal> findByValidUntilBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    // Buscar propostas expiradas
    @Query("SELECT p FROM Proposal p WHERE p.validUntil < :date AND p.status NOT IN ('APPROVED', 'REJECTED', 'CONVERTED')")
    List<Proposal> findExpiredProposals(@Param("date") LocalDate date);
    
    // Buscar propostas que expiram antes de uma data
    List<Proposal> findByValidUntilBefore(LocalDate date);
    
    // Buscar propostas criadas em um perÃ­odo
    @Query("SELECT p FROM Proposal p WHERE p.createdAt BETWEEN :startDate AND :endDate")
    List<Proposal> findByCreatedAtBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // Contar propostas por status
    @Query("SELECT p.status, COUNT(p) FROM Proposal p GROUP BY p.status")
    List<Object[]> countByStatus();
    
    // Contar propostas por status especÃ­fico
    long countByStatus(ProposalStatus status);
    
    // Buscar propostas com valor total acima de um valor
    @Query("SELECT p FROM Proposal p WHERE p.totalValue >= :minValue")
    List<Proposal> findByTotalValueGreaterThanEqual(@Param("minValue") BigDecimal minValue);
    
    // Buscar propostas por mÃºltiplos critÃ©rios
    @Query("SELECT p FROM Proposal p WHERE " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:clientId IS NULL OR p.client.id = :clientId) AND " +
           "(:assignedToId IS NULL OR p.assignedTo.id = :assignedToId) AND " +
           "(:title IS NULL OR p.title LIKE %:title%)")
    Page<Proposal> findByFilters(
        @Param("status") ProposalStatus status,
        @Param("clientId") UUID clientId,
        @Param("assignedToId") UUID assignedToId,
        @Param("title") String title,
        Pageable pageable
    );
    
    // Calcular valor total das propostas por status
    @Query("SELECT p.status, SUM(p.totalValue) FROM Proposal p GROUP BY p.status")
    List<Object[]> sumTotalValueByStatus();
    
    // Calcular valor total das propostas por status especÃ­fico
    @Query("SELECT SUM(p.totalValue) FROM Proposal p WHERE p.status = :status")
    BigDecimal getTotalValueByStatus(@Param("status") ProposalStatus status);
    
    // Buscar propostas por texto (busca em tÃ­tulo, descriÃ§Ã£o, nÃºmero)
    @Query("SELECT p FROM Proposal p WHERE " +
           "p.title LIKE %:searchTerm% OR " +
           "p.description LIKE %:searchTerm% OR " +
           "p.proposalNumber LIKE %:searchTerm%")
    List<Proposal> searchProposals(@Param("searchTerm") String searchTerm);
    
    // Contar propostas por ano
    @Query("SELECT COUNT(p) FROM Proposal p WHERE YEAR(p.createdAt) = :year")
    long countByYear(@Param("year") int year);
} 
