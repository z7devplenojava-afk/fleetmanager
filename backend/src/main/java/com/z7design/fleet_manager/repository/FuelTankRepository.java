package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.FuelTank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FuelTankRepository extends JpaRepository<FuelTank, UUID> {
    List<FuelTank> findByCompanyId(UUID companyId);
}
