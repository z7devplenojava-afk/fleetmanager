package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RouteRepository extends JpaRepository<Route, UUID> {
    long countByCodeStartingWith(String prefix);

    List<Route> findByUnitId(UUID unitId);
}
