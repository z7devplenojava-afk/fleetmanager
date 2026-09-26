package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.WarehouseInboundDocument;
import com.z7design.fleet_manager.model.enums.WarehouseInboundStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WarehouseInboundDocumentRepository extends JpaRepository<WarehouseInboundDocument, UUID> {

    Optional<WarehouseInboundDocument> findByCompanyIdAndAccessKey(UUID companyId, String accessKey);

    Page<WarehouseInboundDocument> findByCompanyIdOrderByArrivalDateDesc(UUID companyId, Pageable pageable);

    Page<WarehouseInboundDocument> findByCompanyIdAndStatusOrderByArrivalDateDesc(UUID companyId, WarehouseInboundStatus status, Pageable pageable);
}
