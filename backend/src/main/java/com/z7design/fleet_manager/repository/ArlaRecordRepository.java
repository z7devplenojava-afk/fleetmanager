package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ArlaRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ArlaRecordRepository extends JpaRepository<ArlaRecord, UUID> {
    List<ArlaRecord> findByVehicleId(UUID vehicleId);
}
