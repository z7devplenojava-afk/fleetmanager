package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.WarehouseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WarehouseCategoryRepository extends JpaRepository<WarehouseCategory, UUID> {

    List<WarehouseCategory> findByCompanyIdAndActiveTrueOrderByNameAsc(UUID companyId);

    List<WarehouseCategory> findByCompanyIdAndParentIsNullAndActiveTrueOrderByNameAsc(UUID companyId);

    List<WarehouseCategory> findByCompanyIdAndParentIdAndActiveTrueOrderByNameAsc(UUID companyId, UUID parentId);

    Optional<WarehouseCategory> findByCompanyIdAndCode(UUID companyId, String code);
}
