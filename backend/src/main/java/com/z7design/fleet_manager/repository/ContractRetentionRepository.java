package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ContractRetention;
import com.z7design.fleet_manager.model.enums.RetentionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContractRetentionRepository extends JpaRepository<ContractRetention, UUID> {

    List<ContractRetention> findByClientId(UUID clientId);

    List<ContractRetention> findByContractId(UUID contractId);

    List<ContractRetention> findByMeasurementId(UUID measurementId);

    List<ContractRetention> findByStatus(RetentionStatus status);

    Optional<ContractRetention> findFirstByMeasurementId(UUID measurementId);
}
