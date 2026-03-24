package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.WorkOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkOrderItemRepository extends JpaRepository<WorkOrderItem, UUID> {
    List<WorkOrderItem> findByWorkOrderId(UUID workOrderId);
}
