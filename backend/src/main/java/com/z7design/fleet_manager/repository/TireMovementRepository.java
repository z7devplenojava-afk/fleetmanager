package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.TireMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TireMovementRepository extends JpaRepository<TireMovement, UUID> {
    List<TireMovement> findByTireIdOrderByMovementDateDesc(UUID tireId);

    List<TireMovement> findByVehicleIdOrderByMovementDateDesc(UUID vehicleId);
}
