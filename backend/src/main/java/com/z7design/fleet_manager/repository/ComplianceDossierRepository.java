package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ComplianceDossier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ComplianceDossierRepository extends JpaRepository<ComplianceDossier, UUID> {

    List<ComplianceDossier> findByClientIdOrderByReferenceMonthDesc(UUID clientId);

    Optional<ComplianceDossier> findByReferenceMonthAndClientId(String referenceMonth, UUID clientId);

    List<ComplianceDossier> findByStatus(String status);
}
