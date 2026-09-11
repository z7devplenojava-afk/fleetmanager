package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.LavajatoService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LavajatoServiceRepository extends JpaRepository<LavajatoService, UUID> {

    List<LavajatoService> findByVehicleIdOrderByCreatedAtDesc(UUID vehicleId);

    List<LavajatoService> findByStatusOrderByCreatedAtDesc(LavajatoService.LavajatoStatus status);

    List<LavajatoService> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);

    List<LavajatoService> findByVehicleIdAndStatusOrderByCreatedAtDesc(
            UUID vehicleId, LavajatoService.LavajatoStatus status);
}
