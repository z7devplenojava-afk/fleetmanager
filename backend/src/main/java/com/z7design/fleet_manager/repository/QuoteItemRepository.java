package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.QuoteItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuoteItemRepository extends JpaRepository<QuoteItem, java.util.UUID> {
    
    List<QuoteItem> findByQuoteId(java.util.UUID quoteId);
    
    @Query("SELECT qi FROM QuoteItem qi WHERE qi.quote.id = :quoteId ORDER BY qi.id")
    List<QuoteItem> findItemsByQuoteIdOrdered(@Param("quoteId") java.util.UUID quoteId);
    
    void deleteByQuoteId(java.util.UUID quoteId);
    
    @Query("SELECT SUM(qi.totalPrice) FROM QuoteItem qi WHERE qi.quote.id = :quoteId")
    Double getTotalValueByQuoteId(@Param("quoteId") java.util.UUID quoteId);
} 
