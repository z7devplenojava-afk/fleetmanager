package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Quote;
import com.z7design.fleet_manager.model.enums.QuoteStatus;
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
public interface QuoteRepository extends JpaRepository<Quote, UUID> {
    
    // Buscar quotes por status
    List<Quote> findByStatus(QuoteStatus status);
    
    // Buscar quotes por status com paginaÃ§Ã£o
    Page<Quote> findByStatus(QuoteStatus status, Pageable pageable);
    
    // Buscar quotes por cliente
    List<Quote> findByClientId(UUID clientId);
    
    // Buscar quotes por lead
    List<Quote> findByLeadId(UUID leadId);
    
    // Buscar quotes por responsÃ¡vel
    List<Quote> findByAssignedToId(UUID assignedToId);
    
    // Buscar quotes por criador
    List<Quote> findByCreatedById(UUID createdById);
    
    // Buscar quotes por nÃºmero
    List<Quote> findByQuoteNumberContaining(String quoteNumber);
    
    // Buscar quotes por tÃ­tulo
    List<Quote> findByTitleContainingIgnoreCase(String title);
    
    // Buscar quotes que expiram em uma data
    @Query("SELECT q FROM Quote q WHERE q.validUntil = :date")
    List<Quote> findByValidUntil(@Param("date") LocalDate date);
    
    // Buscar quotes que expiram em um perÃ­odo
    @Query("SELECT q FROM Quote q WHERE q.validUntil BETWEEN :startDate AND :endDate")
    List<Quote> findByValidUntilBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    // Buscar quotes expiradas
    @Query("SELECT q FROM Quote q WHERE q.validUntil < :date AND q.status NOT IN ('APPROVED', 'REJECTED', 'CONVERTED')")
    List<Quote> findExpiredQuotes(@Param("date") LocalDate date);
    
    // Buscar quotes que expiram antes de uma data
    List<Quote> findByValidUntilBefore(LocalDate date);
    
    // Buscar quotes criadas em um perÃ­odo
    @Query("SELECT q FROM Quote q WHERE q.createdAt BETWEEN :startDate AND :endDate")
    List<Quote> findByCreatedAtBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // Contar quotes por status
    @Query("SELECT q.status, COUNT(q) FROM Quote q GROUP BY q.status")
    List<Object[]> countByStatus();
    
    // Contar quotes por status especÃ­fico
    long countByStatus(QuoteStatus status);
    
    // Buscar quotes com valor total acima de um valor
    @Query("SELECT q FROM Quote q WHERE q.totalValue >= :minValue")
    List<Quote> findByTotalValueGreaterThanEqual(@Param("minValue") BigDecimal minValue);
    
    // Buscar quotes por mÃºltiplos critÃ©rios
    @Query("SELECT q FROM Quote q WHERE " +
           "(:status IS NULL OR q.status = :status) AND " +
           "(:clientId IS NULL OR q.client.id = :clientId) AND " +
           "(:assignedToId IS NULL OR q.assignedTo.id = :assignedToId) AND " +
           "(:title IS NULL OR q.title LIKE %:title%)")
    Page<Quote> findByFilters(
        @Param("status") QuoteStatus status,
        @Param("clientId") UUID clientId,
        @Param("assignedToId") UUID assignedToId,
        @Param("title") String title,
        Pageable pageable
    );
    
    // Calcular valor total das quotes por status
    @Query("SELECT q.status, SUM(q.totalValue) FROM Quote q GROUP BY q.status")
    List<Object[]> sumTotalValueByStatus();
    
    // Calcular valor total das quotes por status especÃ­fico
    @Query("SELECT SUM(q.totalValue) FROM Quote q WHERE q.status = :status")
    BigDecimal getTotalValueByStatus(@Param("status") QuoteStatus status);
    
    // Buscar quotes por texto (busca em tÃ­tulo, descriÃ§Ã£o, nÃºmero)
    @Query("SELECT q FROM Quote q WHERE " +
           "q.title LIKE %:searchTerm% OR " +
           "q.description LIKE %:searchTerm% OR " +
           "q.quoteNumber LIKE %:searchTerm%")
    List<Quote> searchQuotes(@Param("searchTerm") String searchTerm);
    
    // Contar quotes por ano
    @Query("SELECT COUNT(q) FROM Quote q WHERE YEAR(q.createdAt) = :year")
    long countByYear(@Param("year") int year);
} 
