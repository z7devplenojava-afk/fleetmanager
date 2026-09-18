package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Garage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GarageRepository extends JpaRepository<Garage, UUID> {

    List<Garage> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);

    /** Todas as garagens ativas (usado pelo scheduler de alertas de lotação). */
    List<Garage> findByActiveTrue();

    Optional<Garage> findFirstByCompanyIdAndNameIgnoreCase(UUID companyId, String name);
}
