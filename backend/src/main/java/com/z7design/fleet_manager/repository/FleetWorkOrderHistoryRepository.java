package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.FleetWorkOrderHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FleetWorkOrderHistoryRepository extends JpaRepository<FleetWorkOrderHistory, UUID> {
    List<FleetWorkOrderHistory> findByWorkOrderIdOrderByCreatedAtAsc(UUID workOrderId);
}
