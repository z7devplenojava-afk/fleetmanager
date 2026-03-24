package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.DailyLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface DailyLogRepository extends JpaRepository<DailyLog, UUID> {
    List<DailyLog> findByDateBetween(LocalDate startDate, LocalDate endDate);

    List<DailyLog> findByVehicleId(UUID vehicleId);
}
