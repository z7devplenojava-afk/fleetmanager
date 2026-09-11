package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ClientDocStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClientDocStageRepository extends JpaRepository<ClientDocStage, UUID> {

    List<ClientDocStage> findByDocumentationIdOrderBySortOrderAsc(UUID documentationId);

    void deleteByDocumentationId(UUID documentationId);
}
