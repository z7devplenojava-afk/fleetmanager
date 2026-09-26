package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.WarehouseInboundItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WarehouseInboundItemRepository extends JpaRepository<WarehouseInboundItem, UUID> {

    List<WarehouseInboundItem> findByInboundDocumentId(UUID inboundDocumentId);
}
