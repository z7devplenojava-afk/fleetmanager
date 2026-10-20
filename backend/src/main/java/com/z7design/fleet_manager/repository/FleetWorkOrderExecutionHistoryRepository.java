package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.FleetWorkOrderExecutionHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FleetWorkOrderExecutionHistoryRepository extends JpaRepository<FleetWorkOrderExecutionHistory, UUID> {
    List<FleetWorkOrderExecutionHistory> findByWorkOrderIdOrderByCreatedAtDesc(UUID workOrderId);
}
