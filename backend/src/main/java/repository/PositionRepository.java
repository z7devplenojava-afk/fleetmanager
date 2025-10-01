package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PositionRepository extends JpaRepository<Position, UUID> {
    Optional<Position> findByName(String name);
    boolean existsByName(String name);
} 