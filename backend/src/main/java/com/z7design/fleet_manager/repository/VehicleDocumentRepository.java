package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.VehicleDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface VehicleDocumentRepository extends JpaRepository<VehicleDocument, UUID> {

    List<VehicleDocument> findByVehicleIdOrderByCreatedAtDesc(UUID vehicleId);

    List<VehicleDocument> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);

    List<VehicleDocument> findByExpiryDateBeforeAndCompanyId(LocalDate date, UUID companyId);
}
