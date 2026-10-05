package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.WarehouseStockLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WarehouseStockLevelRepository extends JpaRepository<WarehouseStockLevel, UUID> {

    List<WarehouseStockLevel> findByCompanyIdAndProductId(UUID companyId, UUID productId);

    Optional<WarehouseStockLevel> findByCompanyIdAndProductIdAndLocationId(UUID companyId, UUID productId, UUID locationId);

    List<WarehouseStockLevel> findByCompanyId(UUID companyId);

    List<WarehouseStockLevel> findByCompanyIdAndProductCategoryId(UUID companyId, UUID categoryId);

    List<WarehouseStockLevel> findByCompanyIdAndLocationId(UUID companyId, UUID locationId);

    @Query("SELECT COALESCE(SUM(s.quantityPhysical), 0) FROM WarehouseStockLevel s " +
           "WHERE s.companyId = :companyId AND s.product.id = :productId")
    BigDecimal getTotalPhysicalStock(@Param("companyId") UUID companyId, @Param("productId") UUID productId);

    @Query("SELECT COALESCE(SUM(s.quantityReserved), 0) FROM WarehouseStockLevel s " +
           "WHERE s.companyId = :companyId AND s.product.id = :productId")
    BigDecimal getTotalReservedStock(@Param("companyId") UUID companyId, @Param("productId") UUID productId);
}
