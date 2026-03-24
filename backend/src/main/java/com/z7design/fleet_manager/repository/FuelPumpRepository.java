package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.FuelPump;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FuelPumpRepository extends JpaRepository<FuelPump, UUID> {
    List<FuelPump> findByCompanyId(UUID companyId);
}
