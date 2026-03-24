package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.InventoryMovement;
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
public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, UUID> {
    
    List<InventoryMovement> findByItemId(UUID itemId);
    List<InventoryMovement> findByType(InventoryMovement.MovementType type);
    List<InventoryMovement> findByStatus(InventoryMovement.MovementStatus status);
    List<InventoryMovement> findByMovementDateBetween(LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT m FROM InventoryMovement m WHERE (:itemId IS NULL OR m.item.id = :itemId) AND (:type IS NULL OR m.type = :type) AND (:status IS NULL OR m.status = :status) AND (:requester IS NULL OR LOWER(m.requester) LIKE LOWER(CONCAT('%', :requester, '%'))) AND (:employeeName IS NULL OR LOWER(m.employeeName) LIKE LOWER(CONCAT('%', :employeeName, '%'))) AND (:department IS NULL OR LOWER(m.department) LIKE LOWER(CONCAT('%', :department, '%'))) AND (:location IS NULL OR LOWER(m.location) LIKE LOWER(CONCAT('%', :location, '%'))) AND (:startDate IS NULL OR m.movementDate >= :startDate) AND (:endDate IS NULL OR m.movementDate <= :endDate)")
    Page<InventoryMovement> findByAdvancedFilters(
        @Param("itemId") UUID itemId,
        @Param("type") InventoryMovement.MovementType type,
        @Param("status") InventoryMovement.MovementStatus status,
        @Param("requester") String requester,
        @Param("employeeName") String employeeName,
        @Param("department") String department,
        @Param("location") String location,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        Pageable pageable
    );
    
    @Query("SELECT m FROM InventoryMovement m WHERE m.item.id = :itemId ORDER BY m.movementDate DESC")
    List<InventoryMovement> findLatestMovementsByItem(@Param("itemId") UUID itemId, Pageable pageable);
} 
