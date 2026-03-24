package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.TravelTrip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TravelTripRepository extends JpaRepository<TravelTrip, UUID> {

    List<TravelTrip> findByStatus(TravelTrip.TravelTripStatus status);

    List<TravelTrip> findByTripType(TravelTrip.TripType tripType);

    List<TravelTrip> findByClientId(UUID clientId);

    List<TravelTrip> findByStatusOrderByNameAsc(TravelTrip.TravelTripStatus status);
}
