package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ClientChecklistTemplateItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClientChecklistTemplateItemRepository extends JpaRepository<ClientChecklistTemplateItem, UUID> {

    List<ClientChecklistTemplateItem> findByTemplateIdOrderByOrderIndexAsc(UUID templateId);
}
