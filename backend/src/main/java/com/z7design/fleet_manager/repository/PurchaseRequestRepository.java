package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.PurchaseRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequest, UUID> {
    
    List<PurchaseRequest> findByStatus(String status);
    
    List<PurchaseRequest> findByPriority(String priority);
    
    List<PurchaseRequest> findByRequesterId(UUID requesterId);
    
    List<PurchaseRequest> findByApproverId(UUID approverId);
    
    List<PurchaseRequest> findByUnitId(UUID unitId);
    
    List<PurchaseRequest> findByDepartment(String department);
    
    List<PurchaseRequest> findByUrgency(String urgency);
    
    @Query("SELECT pr FROM PurchaseRequest pr WHERE pr.requiredDate <= :date AND pr.status != 'COMPLETED'")
    List<PurchaseRequest> findOverdueRequests(@Param("date") LocalDateTime date);
    
    @Query("SELECT pr FROM PurchaseRequest pr WHERE pr.priority = 'URGENT' OR pr.urgency = 'CRITICAL'")
    List<PurchaseRequest> findUrgentRequests();
    
    @Query("SELECT pr FROM PurchaseRequest pr WHERE pr.status = 'SUBMITTED'")
    List<PurchaseRequest> findPendingApprovalRequests();
    
    @Query("SELECT pr FROM PurchaseRequest pr WHERE pr.title LIKE %:searchTerm% OR pr.description LIKE %:searchTerm% OR pr.requestNumber LIKE %:searchTerm%")
    List<PurchaseRequest> searchRequests(@Param("searchTerm") String searchTerm);
    
    @Query("SELECT COUNT(pr) FROM PurchaseRequest pr WHERE pr.status = :status")
    long countByStatus(@Param("status") String status);
    
    @Query("SELECT COUNT(pr) FROM PurchaseRequest pr WHERE pr.priority = 'URGENT' OR pr.urgency = 'CRITICAL'")
    long countUrgentRequests();
    
    @Query("SELECT COUNT(pr) FROM PurchaseRequest pr WHERE pr.requiredDate <= :date AND pr.status != 'COMPLETED'")
    long countOverdueRequests(@Param("date") LocalDateTime date);
}
