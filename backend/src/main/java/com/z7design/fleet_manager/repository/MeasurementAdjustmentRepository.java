package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.MeasurementAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MeasurementAdjustmentRepository extends JpaRepository<MeasurementAdjustment, UUID> {
    List<MeasurementAdjustment> findByContractId(UUID contractId);
}
