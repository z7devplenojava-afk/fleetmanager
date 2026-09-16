package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.DriverShift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface DriverShiftRepository extends JpaRepository<DriverShift, UUID> {

    /** Turnos de um motorista em uma data */
    List<DriverShift> findByDriverIdAndShiftDate(UUID driverId, LocalDate shiftDate);

    /** Todos os turnos de uma data */
    List<DriverShift> findByShiftDate(LocalDate shiftDate);

    /** Turnos por status em uma data */
    List<DriverShift> findByShiftDateAndStatus(LocalDate shiftDate, DriverShift.DriverShiftStatus status);

    /** Motoristas disponíveis para realocação em uma data */
    @Query("SELECT ds FROM DriverShift ds WHERE ds.shiftDate = :date " +
           "AND ds.availableForReallocation = true " +
           "AND ds.status IN ('IN_PROGRESS', 'AVAILABLE') " +
           "AND ds.hoursRemaining > 0.25")
    List<DriverShift> findAvailableForReallocation(@Param("date") LocalDate date);

    /** Motoristas disponíveis próximos a uma coordenada (raio aproximado em graus) */
    @Query("SELECT ds FROM DriverShift ds WHERE ds.shiftDate = :date " +
           "AND ds.availableForReallocation = true " +
           "AND ds.status IN ('IN_PROGRESS', 'AVAILABLE') " +
           "AND ds.hoursRemaining > :minHours " +
           "AND ds.currentLatitude IS NOT NULL " +
           "AND ds.currentLongitude IS NOT NULL " +
           "AND ABS(ds.currentLatitude - :lat) < :radiusDegrees " +
           "AND ABS(ds.currentLongitude - :lon) < :radiusDegrees")
    List<DriverShift> findAvailableNearLocation(
            @Param("date") LocalDate date,
            @Param("lat") double latitude,
            @Param("lon") double longitude,
            @Param("radiusDegrees") double radiusDegrees,
            @Param("minHours") double minHours);

    /** Turnos de um motorista em um período */
    List<DriverShift> findByDriverIdAndShiftDateBetween(UUID driverId, LocalDate startDate, LocalDate endDate);

    // M7 (RF-07.5): alocações de motoristas por veículo no período — insumo do DRE de folha
    List<DriverShift> findByVehicleIdAndShiftDateBetween(UUID vehicleId, LocalDate startDate, LocalDate endDate);

    /** Turnos em andamento */
    List<DriverShift> findByStatus(DriverShift.DriverShiftStatus status);
}
