package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PositionRepository extends JpaRepository<Position, UUID> {
    Optional<Position> findByName(String name);
    boolean existsByName(String name);
    
    /**
     * Busca cargos por nome
     */
    @Query("SELECT p FROM Position p " +
           "WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY p.name ASC")
    List<Position> searchPositions(@Param("query") String query);
    
    /**
     * Busca todos os cargos ordenados por nome
     */
    List<Position> findAllByOrderByNameAsc();
} 
