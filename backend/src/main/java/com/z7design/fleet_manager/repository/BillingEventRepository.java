package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.BillingEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BillingEventRepository extends JpaRepository<BillingEvent, UUID> {
    Optional<BillingEvent> findByGatewayNameAndGatewayEventId(String gatewayName, String gatewayEventId);
    List<BillingEvent> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);
}
