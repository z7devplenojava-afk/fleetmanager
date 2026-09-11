package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.VehicleCleaningOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VehicleCleaningOrderRepository extends JpaRepository<VehicleCleaningOrder, UUID> {

    List<VehicleCleaningOrder> findByVehicleIdOrderByCreatedAtDesc(UUID vehicleId);

    List<VehicleCleaningOrder> findByStatusOrderByCreatedAtDesc(VehicleCleaningOrder.CleaningStatus status);

    List<VehicleCleaningOrder> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);

    List<VehicleCleaningOrder> findByVehicleIdAndStatusOrderByCreatedAtDesc(
            UUID vehicleId, VehicleCleaningOrder.CleaningStatus status);
}
