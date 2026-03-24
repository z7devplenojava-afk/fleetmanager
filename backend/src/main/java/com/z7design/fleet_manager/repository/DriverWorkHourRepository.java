package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.DriverWorkHour;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface DriverWorkHourRepository extends JpaRepository<DriverWorkHour, UUID> {
    List<DriverWorkHour> findByEmployeeIdAndReferenceDateBetween(UUID employeeId, LocalDate startDate,
            LocalDate endDate);

    List<DriverWorkHour> findByReferenceDateBetween(LocalDate startDate, LocalDate endDate);
}
