package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.DriverHourCalculationMemory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DriverHourCalculationMemoryRepository extends JpaRepository<DriverHourCalculationMemory, UUID> {
    java.util.Optional<DriverHourCalculationMemory> findByDriverWorkHourId(UUID driverWorkHourId);
}
