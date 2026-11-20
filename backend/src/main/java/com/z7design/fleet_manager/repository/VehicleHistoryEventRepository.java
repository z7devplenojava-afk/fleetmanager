package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.VehicleHistoryEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface VehicleHistoryEventRepository extends JpaRepository<VehicleHistoryEvent, UUID> {
    List<VehicleHistoryEvent> findByVehicleIdOrderByEventDateDesc(UUID vehicleId);
}
