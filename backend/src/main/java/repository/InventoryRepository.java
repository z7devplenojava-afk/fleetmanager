package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, UUID> {
    
    List<Inventory> findByStatus(String status);
    
    List<Inventory> findByType(String type);
    
    List<Inventory> findByPriority(String priority);
    
    List<Inventory> findByResponsibleId(UUID responsibleId);
    
    List<Inventory> findByApproverId(UUID approverId);
    
    List<Inventory> findByUnitId(UUID unitId);
    
    List<Inventory> findByDepartment(String department);
    
    List<Inventory> findByLocation(String location);
    
    @Query("SELECT i FROM Inventory i WHERE i.plannedDate <= :date AND i.status != 'COMPLETED'")
    List<Inventory> findOverdueInventories(@Param("date") LocalDateTime date);
    
    @Query("SELECT i FROM Inventory i WHERE i.status = 'IN_PROGRESS'")
    List<Inventory> findInProgressInventories();
    
    @Query("SELECT i FROM Inventory i WHERE i.priority = 'URGENT'")
    List<Inventory> findUrgentInventories();
    
    @Query("SELECT i FROM Inventory i WHERE i.title LIKE %:searchTerm% OR i.description LIKE %:searchTerm% OR i.inventoryNumber LIKE %:searchTerm%")
    List<Inventory> searchInventories(@Param("searchTerm") String searchTerm);
    
    @Query("SELECT COUNT(i) FROM Inventory i WHERE i.status = :status")
    long countByStatus(@Param("status") String status);
    
    @Query("SELECT COUNT(i) FROM Inventory i WHERE i.priority = 'URGENT'")
    long countUrgentInventories();
    
    @Query("SELECT COUNT(i) FROM Inventory i WHERE i.plannedDate <= :date AND i.status != 'COMPLETED'")
    long countOverdueInventories(@Param("date") LocalDateTime date);
    
    @Query("SELECT i FROM Inventory i WHERE i.varianceItems IS NOT NULL AND i.varianceItems != 0")
    List<Inventory> findInventoriesWithVariance();
}