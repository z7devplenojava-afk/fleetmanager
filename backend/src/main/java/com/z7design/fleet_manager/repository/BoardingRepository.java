package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Boarding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface BoardingRepository extends JpaRepository<Boarding, UUID> {
    List<Boarding> findByTripId(UUID tripId);
    List<Boarding> findByPassengerId(UUID passengerId);
    List<Boarding> findByPassengerIdOrderByBoardingTimeDesc(UUID passengerId);
    List<Boarding> findByCompanyIdOrderByBoardingTimeDesc(UUID companyId);

    @Query("SELECT b FROM Boarding b WHERE (:companyId IS NULL OR b.companyId = :companyId) " +
           "AND (:clientId IS NULL OR b.clientId = :clientId) " +
           "AND (:passengerId IS NULL OR b.passenger.id = :passengerId) " +
           "AND (:startDate IS NULL OR b.boardingTime >= :startDate) " +
           "AND (:endDate IS NULL OR b.boardingTime <= :endDate) " +
           "ORDER BY b.boardingTime DESC")
    List<Boarding> findFiltered(
            @Param("companyId") UUID companyId,
            @Param("clientId") UUID clientId,
            @Param("passengerId") UUID passengerId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
