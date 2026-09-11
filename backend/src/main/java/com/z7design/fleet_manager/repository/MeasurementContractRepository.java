package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.MeasurementContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MeasurementContractRepository extends JpaRepository<MeasurementContract, UUID> {
    List<MeasurementContract> findByClientId(UUID clientId);
    List<MeasurementContract> findByStatus(String status);
    Optional<MeasurementContract> findByContractNumber(String contractNumber);
}
