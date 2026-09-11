package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.MeasurementSurplus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MeasurementSurplusRepository extends JpaRepository<MeasurementSurplus, UUID> {
    List<MeasurementSurplus> findByBulletinId(UUID bulletinId);
}
