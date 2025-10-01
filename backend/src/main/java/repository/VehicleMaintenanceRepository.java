package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.VehicleMaintenance;
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

    // Buscar manutenções por veículo
    List<VehicleMaintenance> findByVehicleIdOrderByDateDesc(UUID vehicleId);

    // Buscar manutenções por status
    List<VehicleMaintenance> findByStatusOrderByDateDesc(VehicleMaintenance.MaintenanceStatus status);

    // Buscar manutenções por prioridade
    List<VehicleMaintenance> findByPriorityOrderByDateDesc(VehicleMaintenance.MaintenancePriority priority);

    // Buscar manutenções por tipo
    List<VehicleMaintenance> findByMaintenanceTypeOrderByDateDesc(VehicleMaintenance.MaintenanceType type);

    // Buscar manutenções por período
    List<VehicleMaintenance> findByDateBetweenOrderByDateDesc(LocalDate startDate, LocalDate endDate);

    // Buscar manutenções por veículo e período
    List<VehicleMaintenance> findByVehicleIdAndDateBetweenOrderByDateDesc(UUID vehicleId, LocalDate startDate, LocalDate endDate);

    // Buscar manutenções por veículo e status
    List<VehicleMaintenance> findByVehicleIdAndStatusOrderByDateDesc(UUID vehicleId, VehicleMaintenance.MaintenanceStatus status);

    // Buscar manutenções por veículo e prioridade
    List<VehicleMaintenance> findByVehicleIdAndPriorityOrderByDateDesc(UUID vehicleId, VehicleMaintenance.MaintenancePriority priority);

    // Contar manutenções por status
    long countByStatus(VehicleMaintenance.MaintenanceStatus status);

    // Contar manutenções por prioridade
    long countByPriority(VehicleMaintenance.MaintenancePriority priority);

    // Contar manutenções por veículo
    long countByVehicleId(UUID vehicleId);

    // Buscar manutenções agendadas para hoje
    @Query("SELECT m FROM VehicleMaintenance m WHERE m.date = :today AND m.status = 'SCHEDULED'")
    List<VehicleMaintenance> findScheduledForToday(@Param("today") LocalDate today);

    // Buscar manutenções urgentes
    @Query("SELECT m FROM VehicleMaintenance m WHERE m.priority = 'URGENT' AND m.status IN ('SCHEDULED', 'IN_PROGRESS')")
    List<VehicleMaintenance> findUrgentMaintenances();

    // Buscar manutenções vencidas (agendadas para datas passadas)
    @Query("SELECT m FROM VehicleMaintenance m WHERE m.date < :today AND m.status = 'SCHEDULED'")
    List<VehicleMaintenance> findOverdueMaintenances(@Param("today") LocalDate today);

    // Buscar próxima manutenção de um veículo
    @Query("SELECT m FROM VehicleMaintenance m WHERE m.vehicle.id = :vehicleId AND m.status = 'SCHEDULED' ORDER BY m.date ASC LIMIT 1")
    VehicleMaintenance findNextScheduledMaintenance(@Param("vehicleId") UUID vehicleId);

    // Buscar última manutenção de um veículo
    @Query("SELECT m FROM VehicleMaintenance m WHERE m.vehicle.id = :vehicleId AND m.status = 'COMPLETED' ORDER BY m.date DESC LIMIT 1")
    VehicleMaintenance findLastCompletedMaintenance(@Param("vehicleId") UUID vehicleId);

    // Buscar manutenções por fornecedor
    List<VehicleMaintenance> findByProviderContainingIgnoreCaseOrderByDateDesc(String provider);

    // Buscar manutenções por custo acima de um valor
    @Query("SELECT m FROM VehicleMaintenance m WHERE m.cost > :minCost ORDER BY m.cost DESC")
    List<VehicleMaintenance> findByCostAbove(@Param("minCost") java.math.BigDecimal minCost);

    // Buscar manutenções por quilometragem acima de um valor
    @Query("SELECT m FROM VehicleMaintenance m WHERE m.mileage > :minMileage ORDER BY m.mileage DESC")
    List<VehicleMaintenance> findByMileageAbove(@Param("minMileage") Integer minMileage);
}
