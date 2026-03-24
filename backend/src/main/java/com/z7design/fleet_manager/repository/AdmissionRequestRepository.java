package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.AdmissionRequest;
import com.z7design.fleet_manager.model.enums.AdmissionRequestStatus;
import com.z7design.fleet_manager.model.enums.AdmissionRequestType;
import com.z7design.fleet_manager.model.enums.AdmissionRequestPriority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface AdmissionRequestRepository extends JpaRepository<AdmissionRequest, UUID> {
    
    List<AdmissionRequest> findByType(AdmissionRequestType type);
    
    List<AdmissionRequest> findByStatus(AdmissionRequestStatus status);
    
    List<AdmissionRequest> findByPriority(AdmissionRequestPriority priority);
    
    List<AdmissionRequest> findByTypeAndStatus(AdmissionRequestType type, AdmissionRequestStatus status);
    
    @Query("SELECT ar FROM AdmissionRequest ar WHERE ar.requester.id = :requesterId")
    List<AdmissionRequest> findByRequesterId(@Param("requesterId") UUID requesterId);
    
    @Query("SELECT ar FROM AdmissionRequest ar WHERE ar.approver.id = :approverId")
    List<AdmissionRequest> findByApproverId(@Param("approverId") UUID approverId);
    
    @Query("SELECT ar FROM AdmissionRequest ar WHERE ar.unit.id = :unitId")
    List<AdmissionRequest> findByUnitId(@Param("unitId") UUID unitId);
    
    @Query("SELECT ar FROM AdmissionRequest ar WHERE ar.status = 'PENDING'")
    List<AdmissionRequest> findPendingApprovalRequests();
    
    @Query("SELECT ar FROM AdmissionRequest ar WHERE " +
           "LOWER(ar.employeeName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(ar.employeeCpf) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(ar.position) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(ar.reason) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<AdmissionRequest> searchByTerm(@Param("searchTerm") String searchTerm);
    
    @Query("SELECT ar FROM AdmissionRequest ar WHERE " +
           "(:type IS NULL OR ar.type = :type) AND " +
           "(:searchTerm IS NULL OR LOWER(ar.employeeName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(ar.employeeCpf) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) AND " +
           "(:startDate IS NULL OR ar.requestDate >= :startDate) AND " +
           "(:endDate IS NULL OR ar.requestDate <= :endDate)")
    List<AdmissionRequest> searchWithFilters(
        @Param("type") AdmissionRequestType type,
        @Param("searchTerm") String searchTerm,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
    
    @Query("SELECT COUNT(ar) FROM AdmissionRequest ar WHERE ar.status = :status")
    long countByStatus(@Param("status") AdmissionRequestStatus status);
    
    @Query("SELECT COUNT(ar) FROM AdmissionRequest ar WHERE ar.type = :type")
    long countByType(@Param("type") AdmissionRequestType type);
}









