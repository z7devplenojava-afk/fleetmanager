package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.WarehouseLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WarehouseLocationRepository extends JpaRepository<WarehouseLocation, UUID> {

    List<WarehouseLocation> findByCompanyIdAndActiveTrueOrderByFullCodeAsc(UUID companyId);

    Optional<WarehouseLocation> findByCompanyIdAndFullCode(UUID companyId, String fullCode);
}
