package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {
    
    List<Product> findByStatus(String status);
    
    List<Product> findByCategory(String category);
    
    List<Product> findByUnitEntityId(UUID unitId);
    
    List<Product> findBySupplier(String supplier);
    
    @Query("SELECT p FROM Product p WHERE p.currentStock <= :minimumStock")
    List<Product> findByCurrentStockLessThanOrEqualTo(@Param("minimumStock") BigDecimal minimumStock);
    
    @Query("SELECT p FROM Product p WHERE p.currentStock >= :maximumStock")
    List<Product> findByCurrentStockGreaterThanOrEqualTo(@Param("maximumStock") BigDecimal maximumStock);
    
    @Query("SELECT p FROM Product p WHERE p.currentStock <= p.minimumStock")
    List<Product> findLowStockProducts();
    
    @Query("SELECT p FROM Product p WHERE p.currentStock >= p.maximumStock")
    List<Product> findOverStockProducts();
    
    @Query("SELECT p FROM Product p WHERE p.currentStock <= p.reorderPoint")
    List<Product> findProductsNeedingReorder();
    
    @Query("SELECT p FROM Product p WHERE p.abcClassification = :classification")
    List<Product> findByAbcClassification(@Param("classification") String classification);
    
    @Query("SELECT p FROM Product p WHERE p.name LIKE %:searchTerm% OR p.description LIKE %:searchTerm% OR p.code LIKE %:searchTerm%")
    List<Product> searchProducts(@Param("searchTerm") String searchTerm);
    
    @Query("SELECT COUNT(p) FROM Product p WHERE p.status = 'ACTIVE'")
    long countActiveProducts();
    
    @Query("SELECT COUNT(p) FROM Product p WHERE p.currentStock <= p.minimumStock")
    long countLowStockProducts();
    
    @Query("SELECT COUNT(p) FROM Product p WHERE p.currentStock = 0")
    long countOutOfStockProducts();
    
    @Query("SELECT SUM(p.currentStock * p.costPrice) FROM Product p WHERE p.status = 'ACTIVE'")
    BigDecimal getTotalInventoryValue();
}