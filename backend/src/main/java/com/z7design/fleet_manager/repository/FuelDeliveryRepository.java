package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.FuelDelivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FuelDeliveryRepository extends JpaRepository<FuelDelivery, UUID> {
    List<FuelDelivery> findByCompanyId(UUID companyId);
}
