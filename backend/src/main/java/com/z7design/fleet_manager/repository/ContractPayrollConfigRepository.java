package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ContractPayrollConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContractPayrollConfigRepository extends JpaRepository<ContractPayrollConfig, UUID> {

    Optional<ContractPayrollConfig> findByContractId(UUID contractId);

    boolean existsByContractId(UUID contractId);
}






