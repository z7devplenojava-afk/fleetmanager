package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.TransportMobilization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface TransportMobilizationRepository extends JpaRepository<TransportMobilization, UUID> {

    List<TransportMobilization> findByVehicleIdOrderByOccurredAtDesc(UUID vehicleId);

    @Query("SELECT tm FROM TransportMobilization tm WHERE " +
            "(:companyId IS NULL OR tm.companyId = :companyId) AND " +
            "(:vehicleId IS NULL OR tm.vehicle.id = :vehicleId) AND " +
            "(:type IS NULL OR tm.type = :type) AND " +
            "(:dateFrom IS NULL OR tm.occurredAt >= :dateFrom) AND " +
            "(:dateTo IS NULL OR tm.occurredAt <= :dateTo) " +
            "ORDER BY tm.occurredAt DESC")
    List<TransportMobilization> findByFilters(
            @Param("companyId") UUID companyId,
            @Param("vehicleId") UUID vehicleId,
            @Param("type") TransportMobilization.MobilizationType type,
            @Param("dateFrom") LocalDateTime dateFrom,
            @Param("dateTo") LocalDateTime dateTo);
}
