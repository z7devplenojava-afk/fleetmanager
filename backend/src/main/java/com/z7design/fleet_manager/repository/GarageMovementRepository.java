package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.GarageMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GarageMovementRepository extends JpaRepository<GarageMovement, UUID> {

    Page<GarageMovement> findByCompanyIdOrderByCreatedAtDesc(UUID companyId, Pageable pageable);

    List<GarageMovement> findByVehicleIdOrderByCreatedAtDesc(UUID vehicleId);

    @Query("SELECT m FROM GarageMovement m WHERE m.toGarage.id = :garageId ORDER BY m.createdAt DESC")
    List<GarageMovement> findRecentArrivals(@Param("garageId") UUID garageId, Pageable pageable);

    @Query("SELECT m FROM GarageMovement m WHERE m.fromGarage.id = :garageId ORDER BY m.createdAt DESC")
    List<GarageMovement> findRecentDepartures(@Param("garageId") UUID garageId, Pageable pageable);
}
