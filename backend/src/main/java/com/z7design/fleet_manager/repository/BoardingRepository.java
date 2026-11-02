package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Boarding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BoardingRepository extends JpaRepository<Boarding, UUID>, JpaSpecificationExecutor<Boarding> {
    List<Boarding> findByTripId(UUID tripId);
    List<Boarding> findByPassengerId(UUID passengerId);
    List<Boarding> findByPassengerIdOrderByBoardingTimeDesc(UUID passengerId);
    List<Boarding> findByCompanyIdOrderByBoardingTimeDesc(UUID companyId);
    List<Boarding> findByScheduleId(UUID scheduleId);

    @org.springframework.data.jpa.repository.Query("SELECT b FROM Boarding b WHERE b.passenger.id = :passengerId AND UPPER(b.direction) = UPPER(:direction) AND b.boardingTime >= :startTime AND b.boardingTime <= :endTime")
    List<Boarding> findByPassengerAndDirectionInDay(
            @org.springframework.data.repository.query.Param("passengerId") UUID passengerId,
            @org.springframework.data.repository.query.Param("direction") String direction,
            @org.springframework.data.repository.query.Param("startTime") java.time.LocalDateTime startTime,
            @org.springframework.data.repository.query.Param("endTime") java.time.LocalDateTime endTime
    );
}
