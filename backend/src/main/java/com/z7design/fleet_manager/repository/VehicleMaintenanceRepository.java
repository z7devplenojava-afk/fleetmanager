package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.VehicleMaintenance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface VehicleMaintenanceRepository extends JpaRepository<VehicleMaintenance, UUID> {

    @Query("SELECT m FROM VehicleMaintenance m JOIN FETCH m.vehicle ORDER BY m.date DESC, m.createdAt DESC")
    List<VehicleMaintenance> findAllWithVehicle();

    // Buscar manutenÃ§Ãµes por veÃ­culo
    List<VehicleMaintenance> findByVehicleIdOrderByDateDesc(UUID vehicleId);

    // Buscar manutenÃ§Ãµes por status
    List<VehicleMaintenance> findByStatusOrderByDateDesc(VehicleMaintenance.MaintenanceStatus status);

    // Buscar manutenÃ§Ãµes por prioridade
    List<VehicleMaintenance> findByPriorityOrderByDateDesc(VehicleMaintenance.MaintenancePriority priority);

    // Buscar manutenÃ§Ãµes por tipo
    List<VehicleMaintenance> findByMaintenanceTypeOrderByDateDesc(VehicleMaintenance.MaintenanceType type);

    // Buscar manutenÃ§Ãµes por perÃ­odo
    List<VehicleMaintenance> findByDateBetweenOrderByDateDesc(LocalDate startDate, LocalDate endDate);

    // Buscar manutenÃ§Ãµes por veÃ­culo e perÃ­odo
    List<VehicleMaintenance> findByVehicleIdAndDateBetweenOrderByDateDesc(UUID vehicleId, LocalDate startDate, LocalDate endDate);

    // Buscar manutenÃ§Ãµes por veÃ­culo e status
    List<VehicleMaintenance> findByVehicleIdAndStatusOrderByDateDesc(UUID vehicleId, VehicleMaintenance.MaintenanceStatus status);

    // Buscar manutenÃ§Ãµes por veÃ­culo e prioridade
    List<VehicleMaintenance> findByVehicleIdAndPriorityOrderByDateDesc(UUID vehicleId, VehicleMaintenance.MaintenancePriority priority);

    // Contar manutenÃ§Ãµes por status
    long countByStatus(VehicleMaintenance.MaintenanceStatus status);

    // Contar manutenÃ§Ãµes por prioridade
    long countByPriority(VehicleMaintenance.MaintenancePriority priority);

    // Contar manutenÃ§Ãµes por veÃ­culo
    long countByVehicleId(UUID vehicleId);

    // Buscar manutenÃ§Ãµes agendadas para hoje
    @Query("SELECT m FROM VehicleMaintenance m WHERE m.date = :today AND m.status = 'SCHEDULED'")
    List<VehicleMaintenance> findScheduledForToday(@Param("today") LocalDate today);

    // Buscar manutenÃ§Ãµes urgentes
    @Query("SELECT m FROM VehicleMaintenance m WHERE m.priority = 'URGENT' AND m.status IN ('SCHEDULED', 'IN_PROGRESS')")
    List<VehicleMaintenance> findUrgentMaintenances();

    // Buscar manutenÃ§Ãµes vencidas (agendadas para datas passadas)
    @Query("SELECT m FROM VehicleMaintenance m WHERE m.date < :today AND m.status = 'SCHEDULED'")
    List<VehicleMaintenance> findOverdueMaintenances(@Param("today") LocalDate today);

    // Buscar prÃ³xima manutenÃ§Ã£o de um veÃ­culo
    @Query("SELECT m FROM VehicleMaintenance m WHERE m.vehicle.id = :vehicleId AND m.status = 'SCHEDULED' ORDER BY m.date ASC LIMIT 1")
    VehicleMaintenance findNextScheduledMaintenance(@Param("vehicleId") UUID vehicleId);

    // Buscar Ãºltima manutenÃ§Ã£o de um veÃ­culo
    @Query("SELECT m FROM VehicleMaintenance m WHERE m.vehicle.id = :vehicleId AND m.status = 'COMPLETED' ORDER BY m.date DESC LIMIT 1")
    VehicleMaintenance findLastCompletedMaintenance(@Param("vehicleId") UUID vehicleId);

    // Buscar manutenÃ§Ãµes por fornecedor
    List<VehicleMaintenance> findByProviderContainingIgnoreCaseOrderByDateDesc(String provider);

    // Buscar manutenÃ§Ãµes por custo acima de um valor
    @Query("SELECT m FROM VehicleMaintenance m WHERE m.cost > :minCost ORDER BY m.cost DESC")
    List<VehicleMaintenance> findByCostAbove(@Param("minCost") java.math.BigDecimal minCost);

    // Buscar manutenÃ§Ãµes por quilometragem acima de um valor
    @Query("SELECT m FROM VehicleMaintenance m WHERE m.mileage > :minMileage ORDER BY m.mileage DESC")
    List<VehicleMaintenance> findByMileageAbove(@Param("minMileage") Integer minMileage);
}

