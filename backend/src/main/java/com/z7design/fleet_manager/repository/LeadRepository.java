package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Lead;
import com.z7design.fleet_manager.model.enums.LeadStatus;
import com.z7design.fleet_manager.model.enums.LeadSource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface LeadRepository extends JpaRepository<Lead, UUID> {
    
    // Buscar leads por status
    List<Lead> findByStatus(LeadStatus status);
    
    // Buscar leads por status com paginaÃ§Ã£o
    Page<Lead> findByStatus(LeadStatus status, Pageable pageable);
    
    // Buscar leads por empresa
    List<Lead> findByCompanyContainingIgnoreCase(String company);
    
    // Buscar leads por email
    List<Lead> findByEmailContainingIgnoreCase(String email);
    
    // Buscar leads por nome
    List<Lead> findByNameContainingIgnoreCase(String name);
    
    // Buscar leads por responsÃ¡vel
    List<Lead> findByAssignedToId(UUID assignedToId);
    
    // Buscar leads por criador
    List<Lead> findByCreatedById(UUID createdById);
    
    // Buscar leads que precisam de follow-up
    @Query("SELECT l FROM Lead l WHERE l.nextFollowUp <= :date AND l.status NOT IN ('WON', 'LOST', 'INACTIVE')")
    List<Lead> findLeadsNeedingFollowUp(@Param("date") LocalDateTime date);
    
    // Buscar leads por fonte
    List<Lead> findBySource(LeadSource source);
    
    // Buscar leads criados em um perÃ­odo
    @Query("SELECT l FROM Lead l WHERE l.createdAt BETWEEN :startDate AND :endDate")
    List<Lead> findByCreatedAtBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // Buscar leads criados apÃ³s uma data
    List<Lead> findByCreatedAtAfter(LocalDateTime since);
    
    // Contar leads por status
    @Query("SELECT l.status, COUNT(l) FROM Lead l GROUP BY l.status")
    List<Object[]> countByStatus();
    
    // Contar leads por status especÃ­fico
    long countByStatus(LeadStatus status);
    
    // Contar leads por fonte
    long countBySource(LeadSource source);
    
    // Buscar leads com valor estimado acima de um valor
    @Query("SELECT l FROM Lead l WHERE l.estimatedValue >= :minValue")
    List<Lead> findByEstimatedValueGreaterThanEqual(@Param("minValue") java.math.BigDecimal minValue);
    
    // Buscar leads por mÃºltiplos critÃ©rios
    @Query("SELECT l FROM Lead l WHERE " +
           "(:status IS NULL OR l.status = :status) AND " +
           "(:source IS NULL OR l.source = :source) AND " +
           "(:assignedToId IS NULL OR l.assignedTo.id = :assignedToId) AND " +
           "(:company IS NULL OR l.company LIKE %:company%)")
    Page<Lead> findByFilters(
        @Param("status") LeadStatus status,
        @Param("source") LeadSource source,
        @Param("assignedToId") UUID assignedToId,
        @Param("company") String company,
        Pageable pageable
    );
    
    // Buscar leads por texto (busca em nome, email, empresa, observaÃ§Ãµes)
    @Query("SELECT l FROM Lead l WHERE " +
           "l.name LIKE %:searchTerm% OR " +
           "l.email LIKE %:searchTerm% OR " +
           "l.company LIKE %:searchTerm% OR " +
           "l.notes LIKE %:searchTerm%")
    List<Lead> searchLeads(@Param("searchTerm") String searchTerm);
} 
