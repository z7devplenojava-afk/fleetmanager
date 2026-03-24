package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.MileageRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface MileageRecordRepository extends JpaRepository<MileageRecord, UUID> {
    
    // Buscar por veÃ­culo
    List<MileageRecord> findByVehicleId(UUID vehicleId);
    Page<MileageRecord> findByVehicleId(UUID vehicleId, Pageable pageable);
    
    // Buscar por perÃ­odo
    List<MileageRecord> findByDateBetween(LocalDate startDate, LocalDate endDate);
    List<MileageRecord> findByVehicleIdAndDateBetween(UUID vehicleId, LocalDate startDate, LocalDate endDate);
    
    // Buscar por motorista
    List<MileageRecord> findByDriverContainingIgnoreCase(String driver);
    
    // Buscar por tipo de viagem
    List<MileageRecord> findByTripType(MileageRecord.TripType tripType);
    List<MileageRecord> findByVehicleIdAndTripType(UUID vehicleId, MileageRecord.TripType tripType);
    
    // Buscar por tipo de combustÃ­vel
    List<MileageRecord> findByFuelType(MileageRecord.FuelType fuelType);
    List<MileageRecord> findByVehicleIdAndFuelType(UUID vehicleId, MileageRecord.FuelType fuelType);
    
    // Buscar por destino
    List<MileageRecord> findByDestinationContainingIgnoreCase(String destination);
    
    // Buscar por propÃ³sito
    List<MileageRecord> findByPurposeContainingIgnoreCase(String purpose);
    
    // Buscar registros com alto consumo
    @Query("SELECT mr FROM MileageRecord mr WHERE mr.averageConsumption < :threshold")
    List<MileageRecord> findByLowConsumption(@Param("threshold") BigDecimal threshold);
    
    // Buscar registros com alto custo por km
    @Query("SELECT mr FROM MileageRecord mr WHERE mr.costPerKm > :threshold")
    List<MileageRecord> findByHighCostPerKm(@Param("threshold") BigDecimal threshold);
    
    // Busca avanÃ§ada com mÃºltiplos filtros
    @Query("SELECT mr FROM MileageRecord mr WHERE " +
           "(:vehicleId IS NULL OR mr.vehicle.id = :vehicleId) AND " +
           "(:startDate IS NULL OR mr.date >= :startDate) AND " +
           "(:endDate IS NULL OR mr.date <= :endDate) AND " +
           "(:tripType IS NULL OR mr.tripType = :tripType) AND " +
           "(:fuelType IS NULL OR mr.fuelType = :fuelType) AND " +
           "(:driver IS NULL OR mr.driver LIKE %:driver%) AND " +
           "(:destination IS NULL OR mr.destination LIKE %:destination%) AND " +
           "(:purpose IS NULL OR mr.purpose LIKE %:purpose%)")
    Page<MileageRecord> findByAdvancedFilters(
        @Param("vehicleId") UUID vehicleId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        @Param("tripType") MileageRecord.TripType tripType,
        @Param("fuelType") MileageRecord.FuelType fuelType,
        @Param("driver") String driver,
        @Param("destination") String destination,
        @Param("purpose") String purpose,
        Pageable pageable
    );
    
    // EstatÃ­sticas por veÃ­culo
    @Query("SELECT SUM(mr.distanceTraveled) FROM MileageRecord mr WHERE mr.vehicle.id = :vehicleId")
    Integer getTotalDistanceByVehicle(@Param("vehicleId") UUID vehicleId);
    
    @Query("SELECT SUM(mr.fuelConsumed) FROM MileageRecord mr WHERE mr.vehicle.id = :vehicleId")
    BigDecimal getTotalFuelConsumedByVehicle(@Param("vehicleId") UUID vehicleId);
    
    @Query("SELECT SUM(mr.fuelCost) FROM MileageRecord mr WHERE mr.vehicle.id = :vehicleId")
    BigDecimal getTotalFuelCostByVehicle(@Param("vehicleId") UUID vehicleId);
    
    @Query("SELECT AVG(mr.averageConsumption) FROM MileageRecord mr WHERE mr.vehicle.id = :vehicleId")
    BigDecimal getAverageConsumptionByVehicle(@Param("vehicleId") UUID vehicleId);
    
    @Query("SELECT AVG(mr.costPerKm) FROM MileageRecord mr WHERE mr.vehicle.id = :vehicleId")
    BigDecimal getAverageCostPerKmByVehicle(@Param("vehicleId") UUID vehicleId);
    
    // EstatÃ­sticas por perÃ­odo
    @Query("SELECT SUM(mr.distanceTraveled) FROM MileageRecord mr WHERE mr.date BETWEEN :startDate AND :endDate")
    Integer getTotalDistanceInPeriod(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT SUM(mr.fuelConsumed) FROM MileageRecord mr WHERE mr.date BETWEEN :startDate AND :endDate")
    BigDecimal getTotalFuelConsumedInPeriod(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT SUM(mr.fuelCost) FROM MileageRecord mr WHERE mr.date BETWEEN :startDate AND :endDate")
    BigDecimal getTotalFuelCostInPeriod(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    // RelatÃ³rios agrupados
    @Query("SELECT mr.tripType, SUM(mr.distanceTraveled), SUM(mr.fuelConsumed), SUM(mr.fuelCost), AVG(mr.averageConsumption) " +
           "FROM MileageRecord mr GROUP BY mr.tripType")
    List<Object[]> getStatsByTripType();
    
    @Query("SELECT mr.fuelType, SUM(mr.distanceTraveled), SUM(mr.fuelConsumed), SUM(mr.fuelCost), AVG(mr.averageConsumption) " +
           "FROM MileageRecord mr GROUP BY mr.fuelType")
    List<Object[]> getStatsByFuelType();
    
    @Query("SELECT mr.vehicle.plate, SUM(mr.distanceTraveled), SUM(mr.fuelConsumed), SUM(mr.fuelCost), AVG(mr.averageConsumption) " +
           "FROM MileageRecord mr GROUP BY mr.vehicle.plate")
    List<Object[]> getStatsByVehicle();
    
    @Query("SELECT mr.driver, SUM(mr.distanceTraveled), SUM(mr.fuelConsumed), SUM(mr.fuelCost), AVG(mr.averageConsumption) " +
           "FROM MileageRecord mr WHERE mr.driver IS NOT NULL GROUP BY mr.driver")
    List<Object[]> getStatsByDriver();
    
    // Top 10 veÃ­culos com maior quilometragem
    @Query("SELECT mr.vehicle.plate, SUM(mr.distanceTraveled) as totalDistance " +
           "FROM MileageRecord mr GROUP BY mr.vehicle.plate ORDER BY totalDistance DESC")
    List<Object[]> getTopVehiclesByDistance(Pageable pageable);
    
    // Top 10 veÃ­culos com melhor consumo
    @Query("SELECT mr.vehicle.plate, AVG(mr.averageConsumption) as avgConsumption " +
           "FROM MileageRecord mr GROUP BY mr.vehicle.plate ORDER BY avgConsumption DESC")
    List<Object[]> getTopVehiclesByConsumption(Pageable pageable);
    
    // Top 10 veÃ­culos com menor custo por km
    @Query("SELECT mr.vehicle.plate, AVG(mr.costPerKm) as avgCostPerKm " +
           "FROM MileageRecord mr GROUP BY mr.vehicle.plate ORDER BY avgCostPerKm ASC")
    List<Object[]> getTopVehiclesByCostPerKm(Pageable pageable);
    
    // Ãšltimo registro de cada veÃ­culo
    @Query("SELECT mr FROM MileageRecord mr WHERE mr.vehicle.id = :vehicleId ORDER BY mr.date DESC, mr.createdAt DESC")
    List<MileageRecord> findLatestByVehicle(@Param("vehicleId") UUID vehicleId, Pageable pageable);
    
    // Verificar se existe registro para a data e veÃ­culo
    @Query("SELECT COUNT(mr) > 0 FROM MileageRecord mr WHERE mr.vehicle.id = :vehicleId AND mr.date = :date")
    boolean existsByVehicleAndDate(@Param("vehicleId") UUID vehicleId, @Param("date") LocalDate date);
} 
