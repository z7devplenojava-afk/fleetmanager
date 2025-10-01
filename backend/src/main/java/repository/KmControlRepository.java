package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.KmControl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KmControlRepository extends JpaRepository<KmControl, UUID> {
    
    // Buscar por supervisor
    List<KmControl> findBySupervisorOrderByDateDesc(String supervisor);
    
    // Buscar por veículo (ID)
    List<KmControl> findByVehicleIdOrderByDateDesc(java.util.UUID vehicleId);
    
    // Buscar por placa do veículo
    List<KmControl> findByVehiclePlateOrderByDateDesc(String vehiclePlate);
    
    // Buscar por período
    List<KmControl> findByDateBetweenOrderByDateDesc(LocalDate startDate, LocalDate endDate);
    
    // Buscar por supervisor e período
    List<KmControl> findBySupervisorAndDateBetweenOrderByDateDesc(
        String supervisor, LocalDate startDate, LocalDate endDate);
    
    // Buscar por veículo e período
    List<KmControl> findByVehiclePlateAndDateBetweenOrderByDateDesc(
        String vehiclePlate, LocalDate startDate, LocalDate endDate);
    
    // Buscar por supervisor, veículo e período
    List<KmControl> findBySupervisorAndVehiclePlateAndDateBetweenOrderByDateDesc(
        String supervisor, String vehiclePlate, LocalDate startDate, LocalDate endDate);
    
    // Buscar registros com observações
    List<KmControl> findByObservationsIsNotNullOrProblemDescriptionIsNotNullOrderByDateDesc();
    
    // Buscar registros por posto de trabalho
    List<KmControl> findByWorkPostOrderByDateDesc(String workPost);
    
    // Estatísticas por período
    @Query("SELECT COUNT(k), SUM(k.totalKm), SUM(k.value) FROM KmControl k WHERE k.date BETWEEN :startDate AND :endDate")
    Object[] getStatisticsByPeriod(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    // Estatísticas por supervisor
    @Query("SELECT COUNT(k), SUM(k.totalKm), SUM(k.value) FROM KmControl k WHERE k.supervisor = :supervisor")
    Object[] getStatisticsBySupervisor(@Param("supervisor") String supervisor);
    
    // Estatísticas por veículo
    @Query("SELECT COUNT(k), SUM(k.totalKm), SUM(k.value) FROM KmControl k WHERE k.vehiclePlate = :vehiclePlate")
    Object[] getStatisticsByVehicle(@Param("vehiclePlate") String vehiclePlate);
    
    // Buscar registros recentes
    List<KmControl> findTop10ByOrderByDateDesc();
    
    // Verificar se existe registro para veículo na data
    boolean existsByVehiclePlateAndDate(String vehiclePlate, LocalDate date);
    
    // Buscar por supervisor e data
    Optional<KmControl> findBySupervisorAndDate(String supervisor, LocalDate date);
    
    // Buscar supervisores únicos dos registros de KM
    @Query("SELECT DISTINCT k.supervisor FROM KmControl k ORDER BY k.supervisor")
    List<String> findDistinctSupervisors();
}
