package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.TripEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TripEventRepository extends JpaRepository<TripEvent, UUID> {
    List<TripEvent> findByTripIdOrderByTimestampAsc(UUID tripId);

    List<TripEvent> findAllByOrderByTimestampDesc();
}
