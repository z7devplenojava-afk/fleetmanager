package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.PurchaseQuotation;
import com.z7design.fleet_manager.model.enums.PurchaseQuotationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface PurchaseQuotationRepository extends JpaRepository<PurchaseQuotation, UUID> {
    
    @Query("SELECT DISTINCT pq FROM PurchaseQuotation pq " +
           "LEFT JOIN FETCH pq.supplier " +
           "LEFT JOIN FETCH pq.unit " +
           "LEFT JOIN FETCH pq.createdBy " +
           "LEFT JOIN FETCH pq.assignedTo " +
           "LEFT JOIN FETCH pq.purchaseRequest")
    List<PurchaseQuotation> findAllWithRelations();
    
    List<PurchaseQuotation> findByStatus(PurchaseQuotationStatus status);
    
    List<PurchaseQuotation> findBySupplierId(UUID supplierId);
    
    List<PurchaseQuotation> findByUnitId(UUID unitId);
    
    List<PurchaseQuotation> findByAssignedToId(UUID assignedToId);
    
    List<PurchaseQuotation> findByCreatedById(UUID createdById);
    
    @Query("SELECT pq FROM PurchaseQuotation pq WHERE pq.validUntil < :today AND pq.status != :expiredStatus")
    List<PurchaseQuotation> findExpiredQuotations(@Param("today") LocalDate today, 
                                                   @Param("expiredStatus") PurchaseQuotationStatus expiredStatus);
    
    @Query("SELECT pq FROM PurchaseQuotation pq WHERE pq.validUntil BETWEEN :today AND :futureDate")
    List<PurchaseQuotation> findQuotationsExpiringSoon(@Param("today") LocalDate today, 
                                                        @Param("futureDate") LocalDate futureDate);
    
    @Query("SELECT pq FROM PurchaseQuotation pq WHERE " +
           "LOWER(pq.title) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(pq.quoteNumber) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(pq.description) LIKE LOWER(CONCAT('%', :term, '%'))")
    List<PurchaseQuotation> searchQuotations(@Param("term") String term);
    
    long countByStatus(PurchaseQuotationStatus status);
}






