package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.FuelTankAlertLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FuelTankAlertLogRepository extends JpaRepository<FuelTankAlertLog, UUID> {
    List<FuelTankAlertLog> findByCompanyIdOrderByAlertDateDesc(UUID companyId);
    List<FuelTankAlertLog> findByFuelTankIdOrderByAlertDateDesc(UUID fuelTankId);
}
