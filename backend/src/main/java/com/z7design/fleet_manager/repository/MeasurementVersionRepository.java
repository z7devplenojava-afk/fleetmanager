package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.MeasurementVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MeasurementVersionRepository extends JpaRepository<MeasurementVersion, UUID> {
    List<MeasurementVersion> findByBulletinIdOrderByVersionNumberDesc(UUID bulletinId);
    Optional<MeasurementVersion> findByBulletinIdAndVersionNumber(UUID bulletinId, Integer versionNumber);
}
