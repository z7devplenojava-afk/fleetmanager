package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface TripRepository extends JpaRepository<Trip, UUID> {

    List<Trip> findByTripDateOrderByPlannedDepartureTimeAsc(LocalDate tripDate);

    List<Trip> findByTripDateAndRouteIdOrderByPlannedDepartureTimeAsc(LocalDate tripDate, UUID routeId);

    boolean existsByEscalaIdAndStatusIn(UUID escalaId, Collection<Trip.TripStatus> statuses);
}
