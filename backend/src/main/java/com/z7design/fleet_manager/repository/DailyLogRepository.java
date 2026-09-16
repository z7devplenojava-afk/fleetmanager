package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.DailyLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface DailyLogRepository extends JpaRepository<DailyLog, UUID> {
    List<DailyLog> findByDateBetween(LocalDate startDate, LocalDate endDate);

    List<DailyLog> findByVehicleId(UUID vehicleId);

    /**
     * PRD Módulo 6: maior KM final registrado em Parte Diária do veículo —
     * usado para atualizar o hodômetro do veículo (integração M5 → M6).
     */
    @Query("SELECT MAX(d.finalKm) FROM DailyLog d WHERE d.vehicle.id = :vehicleId AND d.finalKm IS NOT NULL")
    Integer findMaxFinalKmByVehicleId(@Param("vehicleId") UUID vehicleId);

    /**
     * PRD Módulo 6 / RF-06.4: soma dos km rodados (totalKmRun) do veículo no período.
     */
    @Query("SELECT COALESCE(SUM(d.totalKmRun), 0) FROM DailyLog d WHERE d.vehicle.id = :vehicleId AND d.date BETWEEN :start AND :end")
    Long sumKmRunByVehicleAndPeriod(@Param("vehicleId") UUID vehicleId,
                                    @Param("start") LocalDate start,
                                    @Param("end") LocalDate end);

    /**
     * PRD Módulo 6 / RF-06.4: dias distintos com Parte Diária registrada no período
     * (usado para identificar dias sem apontamento = veículo parado).
     */
    @Query("SELECT COUNT(DISTINCT d.date) FROM DailyLog d WHERE d.vehicle.id = :vehicleId AND d.date BETWEEN :start AND :end")
    Long countDistinctDaysByVehicleAndPeriod(@Param("vehicleId") UUID vehicleId,
                                             @Param("start") LocalDate start,
                                             @Param("end") LocalDate end);
}
