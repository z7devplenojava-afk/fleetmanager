package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LocationRepository extends JpaRepository<Location, UUID> {
    List<Location> findByUnitId(UUID unitId);
} 
