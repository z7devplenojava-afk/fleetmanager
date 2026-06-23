package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Disembarking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DisembarkingRepository extends JpaRepository<Disembarking, UUID> {
    Optional<Disembarking> findByBoardingId(UUID boardingId);
}
