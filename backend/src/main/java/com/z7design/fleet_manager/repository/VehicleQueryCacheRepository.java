package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.VehicleQueryCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VehicleQueryCacheRepository extends JpaRepository<VehicleQueryCache, UUID> {

    @Query("SELECT c FROM VehicleQueryCache c WHERE UPPER(c.plate) = UPPER(:plate) AND c.expiresAt > :now ORDER BY c.createdAt DESC")
    List<VehicleQueryCache> findValidCacheByPlate(@Param("plate") String plate, @Param("now") LocalDateTime now);

    List<VehicleQueryCache> findByPlateOrderByCreatedAtDesc(String plate);

    List<VehicleQueryCache> findTop20ByOrderByCreatedAtDesc();
}
