package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.OrderOfService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderOfServiceRepository extends JpaRepository<OrderOfService, UUID> {
    
    List<OrderOfService> findByEmployeeId(UUID employeeId);
    
    List<OrderOfService> findBySigned(Boolean signed);
    
    @Query("SELECT os FROM OrderOfService os WHERE " +
           "LOWER(os.employeeName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(os.role) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(os.company) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(os.client) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(os.workplace) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<OrderOfService> searchByTerm(@Param("searchTerm") String searchTerm);
    
    @Query("SELECT os FROM OrderOfService os WHERE os.employeeId = :employeeId AND os.signed = :signed")
    List<OrderOfService> findByEmployeeIdAndSigned(@Param("employeeId") UUID employeeId, @Param("signed") Boolean signed);
} 
