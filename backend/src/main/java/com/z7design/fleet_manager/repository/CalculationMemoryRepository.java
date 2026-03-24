package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.CalculationMemory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CalculationMemoryRepository extends JpaRepository<CalculationMemory, UUID> {

    // Buscar memÃ³ria de cÃ¡lculo por boletim
    Optional<CalculationMemory> findByBulletinId(UUID bulletinId);

    // Deletar memÃ³ria de cÃ¡lculo por boletim
    void deleteByBulletinId(UUID bulletinId);
}
