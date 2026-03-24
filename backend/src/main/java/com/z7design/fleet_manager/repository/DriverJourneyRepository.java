package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.DriverJourney;
import com.z7design.fleet_manager.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface DriverJourneyRepository extends JpaRepository<DriverJourney, UUID> {

    List<DriverJourney> findByDriverAndStartTimeBetween(User driver, LocalDateTime start, LocalDateTime end);

    @Query("SELECT dj FROM DriverJourney dj WHERE dj.driver.id = :driverId AND dj.startTime >= :start AND dj.startTime <= :end ORDER BY dj.startTime ASC")
    List<DriverJourney> findByDriverIdAndDateRange(@Param("driverId") UUID driverId,
            @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    java.util.Optional<DriverJourney> findBySourceAndNotes(String source, String notes);
}
