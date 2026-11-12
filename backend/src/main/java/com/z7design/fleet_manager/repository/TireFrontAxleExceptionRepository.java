package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.TireFrontAxleException;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TireFrontAxleExceptionRepository extends JpaRepository<TireFrontAxleException, UUID> {
    List<TireFrontAxleException> findByCompanyIdOrderByApprovedAtDesc(UUID companyId);

    List<TireFrontAxleException> findByCompanyIdAndActiveTrueOrderByApprovedAtDesc(UUID companyId);

    List<TireFrontAxleException> findAllByOrderByApprovedAtDesc();

    List<TireFrontAxleException> findByTireIdAndActiveTrue(UUID tireId);

    List<TireFrontAxleException> findByVehicleIdAndPositionCodeAndActiveTrue(UUID vehicleId, String positionCode);
}

