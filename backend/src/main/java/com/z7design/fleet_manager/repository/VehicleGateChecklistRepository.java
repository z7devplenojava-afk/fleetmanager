package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.VehicleGateChecklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface VehicleGateChecklistRepository extends JpaRepository<VehicleGateChecklist, UUID> {

    List<VehicleGateChecklist> findByVehicleIdOrderByOccurredAtDesc(UUID vehicleId);

    List<VehicleGateChecklist> findByTypeOrderByOccurredAtDesc(VehicleGateChecklist.ChecklistType type);

    @Query("SELECT DISTINCT vgc FROM VehicleGateChecklist vgc " +
            "LEFT JOIN FETCH vgc.vehicle " +
            "LEFT JOIN FETCH vgc.driver")
    List<VehicleGateChecklist> findAllWithAssociations();

    @Query("SELECT DISTINCT vgc FROM VehicleGateChecklist vgc " +
            "LEFT JOIN FETCH vgc.vehicle " +
            "LEFT JOIN FETCH vgc.driver " +
            "WHERE (CAST(:vehicleId AS uuid) IS NULL OR vgc.vehicle.id = :vehicleId) AND " +
            "(CAST(:driverId AS uuid) IS NULL OR vgc.driver.id = :driverId) AND " +
            "(CAST(:type AS string) IS NULL OR vgc.type = :type) AND " +
            "(CAST(:dateFrom AS java.time.LocalDateTime) IS NULL OR vgc.occurredAt >= :dateFrom) AND " +
            "(CAST(:dateTo AS java.time.LocalDateTime) IS NULL OR vgc.occurredAt <= :dateTo)")
    List<VehicleGateChecklist> findByFilters(
            @Param("vehicleId") UUID vehicleId,
            @Param("driverId") UUID driverId,
            @Param("type") VehicleGateChecklist.ChecklistType type,
            @Param("dateFrom") LocalDateTime dateFrom,
            @Param("dateTo") LocalDateTime dateTo);
}
