package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.FuelRecord;
import br.com.fleetmanager.model.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FuelRecordRepository extends JpaRepository<FuelRecord, UUID> {
    
    Optional<FuelRecord> findTopByVehicleIdOrderByDateDesc(UUID vehicleId);
    
    List<FuelRecord> findByVehicleId(UUID vehicleId);
    
    List<FuelRecord> findByVehicleIdAndDateBetween(UUID vehicleId, LocalDate startDate, LocalDate endDate);
    
    List<FuelRecord> findByDateBetween(LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT fr FROM FuelRecord fr WHERE fr.vehicle.plate = :plate")
    List<FuelRecord> findByVehiclePlate(@Param("plate") String plate);
    
    @Query("SELECT SUM(fr.cost) FROM FuelRecord fr WHERE fr.vehicle.id = :vehicleId")
    Double getTotalCostByVehicleId(@Param("vehicleId") UUID vehicleId);
    
    // Métodos para cálculo de média de consumo
    @Query("SELECT AVG(fr.quantity) FROM FuelRecord fr WHERE fr.vehicle.id = :vehicleId")
    Double getAverageFuelQuantityByVehicle(@Param("vehicleId") UUID vehicleId);
    
    @Query("SELECT AVG(fr.cost / fr.quantity) FROM FuelRecord fr WHERE fr.vehicle.id = :vehicleId AND fr.quantity > 0")
    Double getAverageFuelPriceByVehicle(@Param("vehicleId") UUID vehicleId);
    
    @Query("SELECT SUM(fr.quantity) FROM FuelRecord fr WHERE fr.vehicle.id = :vehicleId")
    Double getTotalFuelConsumedByVehicle(@Param("vehicleId") UUID vehicleId);
    
    @Query("SELECT SUM(fr.cost) FROM FuelRecord fr WHERE fr.vehicle.id = :vehicleId")
    Double getTotalFuelCostByVehicle(@Param("vehicleId") UUID vehicleId);
    
    // Cálculo de consumo por km (baseado na diferença de quilometragem)
    @Query("SELECT " +
           "SUM(fr.quantity) as totalFuel, " +
           "MAX(fr.mileage) - MIN(fr.mileage) as totalDistance, " +
           "SUM(fr.cost) as totalCost " +
           "FROM FuelRecord fr " +
           "WHERE fr.vehicle.id = :vehicleId " +
           "AND fr.mileage > 0")
    Object[] getFuelConsumptionStatsByVehicle(@Param("vehicleId") UUID vehicleId);
    
    // Média de consumo por km para um período específico
    @Query("SELECT " +
           "SUM(fr.quantity) as totalFuel, " +
           "MAX(fr.mileage) - MIN(fr.mileage) as totalDistance, " +
           "SUM(fr.cost) as totalCost " +
           "FROM FuelRecord fr " +
           "WHERE fr.vehicle.id = :vehicleId " +
           "AND fr.date BETWEEN :startDate AND :endDate " +
           "AND fr.mileage > 0")
    Object[] getFuelConsumptionStatsByVehicleAndPeriod(
        @Param("vehicleId") UUID vehicleId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
    
    // Estatísticas gerais por veículo
    @Query("SELECT " +
           "v.plate, " +
           "COUNT(fr) as totalRecords, " +
           "SUM(fr.quantity) as totalFuel, " +
           "SUM(fr.cost) as totalCost, " +
           "AVG(fr.quantity) as avgQuantity, " +
           "AVG(fr.cost / fr.quantity) as avgPrice " +
           "FROM FuelRecord fr " +
           "JOIN fr.vehicle v " +
           "GROUP BY v.id, v.plate")
    List<Object[]> getFuelStatsByVehicle();
    
    // Top veículos por consumo
    @Query("SELECT " +
           "v.plate, " +
           "SUM(fr.quantity) as totalFuel, " +
           "SUM(fr.cost) as totalCost " +
           "FROM FuelRecord fr " +
           "JOIN fr.vehicle v " +
           "GROUP BY v.id, v.plate " +
           "ORDER BY SUM(fr.quantity) DESC")
    List<Object[]> getTopVehiclesByFuelConsumption();
    
    // Consumo por tipo de combustível
    @Query("SELECT " +
           "fr.fuelType, " +
           "SUM(fr.quantity) as totalFuel, " +
           "SUM(fr.cost) as totalCost, " +
           "AVG(fr.cost / fr.quantity) as avgPrice " +
           "FROM FuelRecord fr " +
           "WHERE fr.vehicle.id = :vehicleId " +
           "GROUP BY fr.fuelType")
    List<Object[]> getFuelConsumptionByType(@Param("vehicleId") UUID vehicleId);
    
    // Último abastecimento por veículo
    @Query("SELECT fr FROM FuelRecord fr WHERE fr.vehicle.id = :vehicleId ORDER BY fr.date DESC, fr.createdAt DESC")
    List<FuelRecord> findLastFuelRecordByVehicle(@Param("vehicleId") UUID vehicleId);
    
    // ==================== QUERIES PARA ESTATÍSTICAS POR MOTORISTA ====================
    
    // Estatísticas gerais por motorista
    @Query("SELECT " +
           "fr.driver, " +
           "COUNT(fr) as totalRecords, " +
           "SUM(fr.quantity) as totalFuel, " +
           "SUM(fr.cost) as totalCost, " +
           "AVG(fr.quantity) as avgQuantity, " +
           "AVG(fr.cost / fr.quantity) as avgPrice " +
           "FROM FuelRecord fr " +
           "WHERE fr.driver IS NOT NULL " +
           "GROUP BY fr.driver")
    List<Object[]> getFuelStatsByDriver();
    
    // Estatísticas de consumo por motorista e veículo
    @Query("SELECT " +
           "fr.driver, " +
           "v.plate, " +
           "v.model, " +
           "COUNT(fr) as recordsCount, " +
           "SUM(fr.quantity) as totalFuel, " +
           "SUM(fr.cost) as totalCost " +
           "FROM FuelRecord fr " +
           "JOIN fr.vehicle v " +
           "WHERE fr.driver IS NOT NULL " +
           "GROUP BY fr.driver, v.id, v.plate, v.model")
    List<Object[]> getFuelStatsByDriverAndVehicle();
    
    // Top motoristas por consumo de combustível (retorna apenas o nome do motorista para evitar serialização de entidade)
    @Query("SELECT " +
           "d.name, " +
           "SUM(fr.quantity) as totalFuel, " +
           "SUM(fr.cost) as totalCost, " +
           "COUNT(fr) as totalRecords " +
           "FROM FuelRecord fr " +
           "JOIN fr.driver d " +
           "WHERE d IS NOT NULL " +
           "GROUP BY d.name " +
           "ORDER BY SUM(fr.quantity) DESC")
    List<Object[]> getTopDriversByFuelConsumption();
    
    // Top motoristas por custo (retorna apenas o nome do motorista para evitar serialização de entidade)
    @Query("SELECT " +
           "d.name, " +
           "SUM(fr.cost) as totalCost, " +
           "SUM(fr.quantity) as totalFuel, " +
           "COUNT(fr) as totalRecords " +
           "FROM FuelRecord fr " +
           "JOIN fr.driver d " +
           "WHERE d IS NOT NULL " +
           "GROUP BY d.name " +
           "ORDER BY SUM(fr.cost) DESC")
    List<Object[]> getTopDriversByCost();
    
    // Consumo por motorista e tipo de combustível
    @Query("SELECT " +
           "fr.driver, " +
           "fr.fuelType, " +
           "SUM(fr.quantity) as totalFuel, " +
           "SUM(fr.cost) as totalCost, " +
           "AVG(fr.cost / fr.quantity) as avgPrice " +
           "FROM FuelRecord fr " +
           "WHERE fr.driver IS NOT NULL " +
           "GROUP BY fr.driver, fr.fuelType")
    List<Object[]> getFuelConsumptionByDriverAndType();
    
    // Último abastecimento por motorista
    @Query("SELECT fr FROM FuelRecord fr WHERE fr.driver = :driver ORDER BY fr.date DESC, fr.createdAt DESC")
    List<FuelRecord> findLastFuelRecordByDriver(@Param("driver") String driver);
    
    // Lista de todos os motoristas
    @Query("SELECT DISTINCT d FROM FuelRecord fr JOIN fr.driver d WHERE d IS NOT NULL ORDER BY d.name")
    List<Driver> findAllDrivers();
    
    // Estatísticas de consumo por motorista em período específico
    @Query("SELECT " +
           "fr.driver, " +
           "COUNT(fr) as totalRecords, " +
           "SUM(fr.quantity) as totalFuel, " +
           "SUM(fr.cost) as totalCost, " +
           "AVG(fr.quantity) as avgQuantity, " +
           "AVG(fr.cost / fr.quantity) as avgPrice " +
           "FROM FuelRecord fr " +
           "WHERE fr.driver IS NOT NULL " +
           "AND fr.date BETWEEN :startDate AND :endDate " +
           "GROUP BY fr.driver")
    List<Object[]> getFuelStatsByDriverAndPeriod(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    List<FuelRecord> findByDriverId(UUID driverId);
    
    List<FuelRecord> findByDriverIdAndDateBetween(UUID driverId, LocalDate startDate, LocalDate endDate);
    
    // Método com JOIN FETCH para evitar LazyInitializationException
    @Query("SELECT fr FROM FuelRecord fr " +
           "LEFT JOIN FETCH fr.vehicle " +
           "LEFT JOIN FETCH fr.driver " +
           "ORDER BY fr.date DESC, fr.createdAt DESC")
    List<FuelRecord> findAllWithVehicleAndDriver();
    
    // Método com JOIN FETCH para buscar por veículo
    @Query("SELECT fr FROM FuelRecord fr " +
           "LEFT JOIN FETCH fr.vehicle " +
           "LEFT JOIN FETCH fr.driver " +
           "WHERE fr.vehicle.id = :vehicleId " +
           "ORDER BY fr.date DESC, fr.createdAt DESC")
    List<FuelRecord> findByVehicleIdWithVehicleAndDriver(@Param("vehicleId") UUID vehicleId);
} 