package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.FleetWorkOrderChecklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FleetWorkOrderChecklistRepository extends JpaRepository<FleetWorkOrderChecklist, UUID> {
    List<FleetWorkOrderChecklist> findByWorkOrderId(UUID workOrderId);
    void deleteByWorkOrderId(UUID workOrderId);
}
