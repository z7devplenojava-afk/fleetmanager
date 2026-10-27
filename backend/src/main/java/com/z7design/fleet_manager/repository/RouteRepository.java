package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Route;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RouteRepository extends JpaRepository<Route, UUID> {
    long countByCodeStartingWith(String prefix);

    List<Route> findByUnitId(UUID unitId);

    @Override
    @EntityGraph(attributePaths = { "points", "client" })
    List<Route> findAll();

    @Override
    @EntityGraph(attributePaths = { "points", "client" })
    Optional<Route> findById(UUID id);
}
