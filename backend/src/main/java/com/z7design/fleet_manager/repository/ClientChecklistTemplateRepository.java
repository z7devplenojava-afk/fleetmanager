package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ClientChecklistTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClientChecklistTemplateRepository extends JpaRepository<ClientChecklistTemplate, UUID> {

    List<ClientChecklistTemplate> findByClientIdOrderByOrderIndexAscNameAsc(UUID clientId);
}
