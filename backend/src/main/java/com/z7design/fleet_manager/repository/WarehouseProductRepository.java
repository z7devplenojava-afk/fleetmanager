package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.WarehouseProduct;
import com.z7design.fleet_manager.model.enums.WarehouseTrackingType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WarehouseProductRepository extends JpaRepository<WarehouseProduct, UUID> {

    Optional<WarehouseProduct> findByCompanyIdAndCode(UUID companyId, String code);

    Optional<WarehouseProduct> findByCompanyIdAndBarcode(UUID companyId, String barcode);

    List<WarehouseProduct> findByCompanyIdAndTrackingTypeAndActiveTrue(UUID companyId, WarehouseTrackingType trackingType);

    @Query("SELECT p FROM WarehouseProduct p WHERE p.companyId = :companyId AND p.active = true " +
           "AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.code) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.barcode) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:categoryId IS NULL OR p.category.id = :categoryId) " +
           "AND (:trackingType IS NULL OR p.trackingType = :trackingType)")
    Page<WarehouseProduct> searchProducts(
            @Param("companyId") UUID companyId,
            @Param("search") String search,
            @Param("categoryId") UUID categoryId,
            @Param("trackingType") WarehouseTrackingType trackingType,
            Pageable pageable
    );
}
