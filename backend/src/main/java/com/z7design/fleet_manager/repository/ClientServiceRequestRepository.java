package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ClientServiceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClientServiceRequestRepository extends JpaRepository<ClientServiceRequest, UUID> {
    List<ClientServiceRequest> findByClientIdOrderByCreatedAtDesc(UUID clientId);
    List<ClientServiceRequest> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);
    List<ClientServiceRequest> findByClientIdAndStatus(UUID clientId, ClientServiceRequest.RequestStatus status);
}
