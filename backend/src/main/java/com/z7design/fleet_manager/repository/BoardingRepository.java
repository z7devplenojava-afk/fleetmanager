package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Boarding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BoardingRepository extends JpaRepository<Boarding, UUID> {
    List<Boarding> findByTripId(UUID tripId);
    List<Boarding> findByPassengerId(UUID passengerId);
}
