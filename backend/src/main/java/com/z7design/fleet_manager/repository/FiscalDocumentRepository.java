package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.FiscalDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FiscalDocumentRepository extends JpaRepository<FiscalDocument, UUID> {
    Optional<FiscalDocument> findByKey(String key);
}
