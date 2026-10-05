package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Tire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TireRepository extends JpaRepository<Tire, UUID> {
    List<Tire> findByVehicleId(UUID vehicleId);

    List<Tire> findByCompanyId(UUID companyId);

    List<Tire> findByCompanyIdAndStatus(UUID companyId, com.z7design.fleet_manager.model.enums.TireStatus status);

    java.util.Optional<Tire> findByVehicleIdAndAxleNumberAndPositionIndex(UUID vehicleId, Integer axleNumber, Integer positionIndex);

    boolean existsBySerialNumber(String serialNumber);

    List<Tire> findBySerialNumberContaining(String infix);
}
