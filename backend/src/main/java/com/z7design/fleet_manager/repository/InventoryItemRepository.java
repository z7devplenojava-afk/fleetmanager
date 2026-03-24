package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.InventoryItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, UUID> {
    
    List<InventoryItem> findByCategory(String category);
    List<InventoryItem> findByStatus(String status);
    List<InventoryItem> findByItemNameContainingIgnoreCase(String itemName);
    List<InventoryItem> findByBrandContainingIgnoreCase(String brand);
    List<InventoryItem> findByModelContainingIgnoreCase(String model);
    List<InventoryItem> findByLocationContainingIgnoreCase(String location);
    
    @Query("SELECT i FROM InventoryItem i WHERE i.countedQuantity <= i.minimumStock")
    List<InventoryItem> findLowStockItems();
    
    @Query("SELECT i FROM InventoryItem i WHERE i.countedQuantity = 0 OR i.countedQuantity IS NULL")
    List<InventoryItem> findOutOfStockItems();
    
    @Query("SELECT i FROM InventoryItem i WHERE (:category IS NULL OR i.category = :category) AND (:status IS NULL OR i.status = :status) AND (:itemName IS NULL OR LOWER(i.itemName) LIKE LOWER(CONCAT('%', :itemName, '%'))) AND (:brand IS NULL OR LOWER(i.brand) LIKE LOWER(CONCAT('%', :brand, '%')))")
    Page<InventoryItem> findByAdvancedFilters(
        @Param("category") String category,
        @Param("status") String status,
        @Param("itemName") String itemName,
        @Param("brand") String brand,
        Pageable pageable
    );
} 
