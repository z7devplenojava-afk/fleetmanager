package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.MeasurementPointing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MeasurementPointingRepository extends JpaRepository<MeasurementPointing, UUID> {
    List<MeasurementPointing> findByBulletinId(UUID bulletinId);
}
