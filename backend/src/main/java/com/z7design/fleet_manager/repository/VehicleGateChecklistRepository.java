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

    @Query("SELECT vgc FROM VehicleGateChecklist vgc WHERE " +
            "(:vehicleId IS NULL OR vgc.vehicle.id = :vehicleId) AND " +
            "(:type IS NULL OR vgc.type = :type) AND " +
            "(:dateFrom IS NULL OR vgc.occurredAt >= :dateFrom) AND " +
            "(:dateTo IS NULL OR vgc.occurredAt <= :dateTo) " +
            "ORDER BY vgc.occurredAt DESC")
    List<VehicleGateChecklist> findByFilters(
            @Param("vehicleId") UUID vehicleId,
            @Param("type") VehicleGateChecklist.ChecklistType type,
            @Param("dateFrom") LocalDateTime dateFrom,
            @Param("dateTo") LocalDateTime dateTo);
}
