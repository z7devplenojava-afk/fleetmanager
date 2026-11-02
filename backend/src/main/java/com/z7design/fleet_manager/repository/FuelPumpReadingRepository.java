package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.FuelPumpReading;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FuelPumpReadingRepository extends JpaRepository<FuelPumpReading, UUID> {
    @EntityGraph(attributePaths = { "fuelPump" })
    List<FuelPumpReading> findByCompanyId(UUID companyId);
}
