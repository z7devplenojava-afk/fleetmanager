package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RouteRepository extends JpaRepository<Route, UUID> {
    List<Route> findByUnitId(UUID unitId);
} 