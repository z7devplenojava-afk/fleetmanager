package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.TireShopServiceCatalog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TireShopServiceCatalogRepository extends JpaRepository<TireShopServiceCatalog, UUID> {

    @Query("SELECT c FROM TireShopServiceCatalog c WHERE c.active = true AND (c.companyId IS NULL OR c.companyId = :companyId) ORDER BY c.code ASC, c.name ASC")
    List<TireShopServiceCatalog> findActiveForCompany(@Param("companyId") UUID companyId);

    @Query("SELECT c FROM TireShopServiceCatalog c WHERE c.active = true ORDER BY c.code ASC, c.name ASC")
    List<TireShopServiceCatalog> findAllActive();
}

