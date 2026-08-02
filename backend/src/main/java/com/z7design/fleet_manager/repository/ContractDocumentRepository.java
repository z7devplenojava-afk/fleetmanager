package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ContractDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContractDocumentRepository extends JpaRepository<ContractDocument, UUID> {

    List<ContractDocument> findByContractIdOrderByCreatedAtDesc(UUID contractId);
}
