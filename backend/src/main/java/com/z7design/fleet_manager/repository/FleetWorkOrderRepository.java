package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.FleetWorkOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FleetWorkOrderRepository extends JpaRepository<FleetWorkOrder, UUID> {
    List<FleetWorkOrder> findByVehicleId(UUID vehicleId);

    List<FleetWorkOrder> findByStatus(FleetWorkOrder.WorkOrderStatus status);
}
