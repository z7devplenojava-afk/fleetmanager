package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.VehicleInspection;
import com.z7design.fleet_manager.model.VehicleInspection.VehicleReleaseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VehicleInspectionRepository extends JpaRepository<VehicleInspection, UUID> {

    Optional<VehicleInspection> findByRegistryNumber(String registryNumber);

    List<VehicleInspection> findByVehiclePlateIgnoreCase(String vehiclePlate);

    Page<VehicleInspection> findByVehiclePlateIgnoreCase(String vehiclePlate, Pageable pageable);

    @Query("SELECT vi FROM VehicleInspection vi WHERE " +
           "vi.deletedAt IS NULL AND " +
           "(:plate IS NULL OR UPPER(vi.vehiclePlate) LIKE UPPER(CONCAT('%', :plate, '%'))) AND " +
           "(:client IS NULL OR UPPER(vi.clientName) LIKE UPPER(CONCAT('%', :client, '%'))) AND " +
           "(:project IS NULL OR UPPER(vi.projectName) LIKE UPPER(CONCAT('%', :project, '%'))) AND " +
           "(:status IS NULL OR vi.releaseStatus = :status) AND " +
           "(:startDate IS NULL OR vi.inspectionDate >= :startDate) AND " +
           "(:endDate IS NULL OR vi.inspectionDate <= :endDate) AND " +
           "(:search IS NULL OR " +
           " UPPER(vi.registryNumber) LIKE UPPER(CONCAT('%', :search, '%')) OR " +
           " UPPER(vi.vehiclePlate) LIKE UPPER(CONCAT('%', :search, '%')) OR " +
           " UPPER(vi.clientName) LIKE UPPER(CONCAT('%', :search, '%')) OR " +
           " UPPER(vi.projectName) LIKE UPPER(CONCAT('%', :search, '%')) OR " +
           " UPPER(vi.servicesPerformed) LIKE UPPER(CONCAT('%', :search, '%')))")
    Page<VehicleInspection> findWithFilters(
            @Param("plate") String plate,
            @Param("client") String client,
            @Param("project") String project,
            @Param("status") VehicleReleaseStatus status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("SELECT vi.registryNumber FROM VehicleInspection vi WHERE vi.registryNumber IS NOT NULL ORDER BY vi.createdAt DESC")
    List<String> findRecentRegistryNumbers(Pageable pageable);
}

