package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.DriverFuelConsumptionStatsDTO;
import com.z7design.fleet_manager.dto.DriverDTO;
import com.z7design.fleet_manager.dto.VehicleFuelStatsDTO;
import com.z7design.fleet_manager.model.FuelRecord;
import com.z7design.fleet_manager.model.Driver;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.FuelRecordRepository;
import com.z7design.fleet_manager.repository.DriverRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DriverFuelConsumptionService {
    
    private final FuelRecordRepository fuelRecordRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    
    /**
     * Buscar estatÃ­sticas de consumo por motorista
     */
    public DriverFuelConsumptionStatsDTO getDriverStats(UUID driverId) {
        Driver driver = driverRepository.findById(driverId).orElseThrow(() -> new RuntimeException("Motorista nÃ£o encontrado"));
        log.info("ðŸ“Š Buscando estatÃ­sticas para motorista: {}", driver.getName());
        
        DriverFuelConsumptionStatsDTO stats = new DriverFuelConsumptionStatsDTO(driver.getName());
        
        // Buscar registros do motorista
        List<FuelRecord> records = fuelRecordRepository.findByDriverId(driverId);
        
        if (records.isEmpty()) {
            log.warn("âš ï¸ Nenhum registro encontrado para o motorista: {}", driver.getName());
            return stats;
        }
        
        // Calcular estatÃ­sticas bÃ¡sicas
        int totalRecords = records.size();
        BigDecimal totalFuel = records.stream()
                .map(FuelRecord::getQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCost = records.stream()
                .map(FuelRecord::getCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Calcular distÃ¢ncia total (baseado na diferenÃ§a de quilometragem)
        int totalDistance = calculateTotalDistance(records);
        
        // Ãšltimo abastecimento
        FuelRecord lastRecord = records.stream()
                .max((r1, r2) -> r1.getDate().compareTo(r2.getDate()))
                .orElse(null);
        
        // Configurar estatÃ­sticas
        stats.setTotalRecords(totalRecords);
        stats.setTotalFuelConsumed(totalFuel);
        stats.setTotalCost(totalCost);
        stats.setTotalDistance(totalDistance);
        
        if (lastRecord != null) {
            stats.setLastRefillDate(lastRecord.getDate());
            stats.setLastRefillQuantity(lastRecord.getQuantity());
            stats.setLastRefillCost(lastRecord.getCost());
        }
        
        // Calcular mÃ©tricas derivadas
        stats.calculateConsumptionPerKm();
        stats.calculateCostPerKm();
        stats.calculateAverageFuelPerRefill();
        stats.calculateAveragePricePerLiter();
        
        // Buscar estatÃ­sticas por veÃ­culo
        List<DriverFuelConsumptionStatsDTO.VehicleStats> vehicleStats = getVehicleStatsByDriver(driver.getName());
        stats.setVehiclesUsed(vehicleStats);
        
        log.info("âœ… EstatÃ­sticas calculadas para {}: {} registros, {} litros, R$ {}", 
                driver.getName(), totalRecords, totalFuel, totalCost);
        
        return stats;
    }
    
    /**
     * Buscar estatÃ­sticas de consumo por motorista em perÃ­odo especÃ­fico
     */
    public DriverFuelConsumptionStatsDTO getDriverStatsByPeriod(UUID driverId, LocalDate startDate, LocalDate endDate) {
        Driver driver = driverRepository.findById(driverId).orElseThrow(() -> new RuntimeException("Motorista nÃ£o encontrado"));
        log.info("ðŸ“Š Buscando estatÃ­sticas para motorista {} no perÃ­odo...", driver.getName());
        
        DriverFuelConsumptionStatsDTO stats = new DriverFuelConsumptionStatsDTO(driver.getName());
        
        // Buscar registros do motorista no perÃ­odo
        List<FuelRecord> records = fuelRecordRepository.findByDriverIdAndDateBetween(driverId, startDate, endDate);
        
        if (records.isEmpty()) {
            log.warn("âš ï¸ Nenhum registro encontrado para o motorista {} no perÃ­odo especificado", driver.getName());
            return stats;
        }
        
        // Calcular estatÃ­sticas bÃ¡sicas
        int totalRecords = records.size();
        BigDecimal totalFuel = records.stream()
                .map(FuelRecord::getQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCost = records.stream()
                .map(FuelRecord::getCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Calcular distÃ¢ncia total
        int totalDistance = calculateTotalDistance(records);
        
        // Ãšltimo abastecimento no perÃ­odo
        FuelRecord lastRecord = records.stream()
                .max((r1, r2) -> r1.getDate().compareTo(r2.getDate()))
                .orElse(null);
        
        // Configurar estatÃ­sticas
        stats.setTotalRecords(totalRecords);
        stats.setTotalFuelConsumed(totalFuel);
        stats.setTotalCost(totalCost);
        stats.setTotalDistance(totalDistance);
        
        if (lastRecord != null) {
            stats.setLastRefillDate(lastRecord.getDate());
            stats.setLastRefillQuantity(lastRecord.getQuantity());
            stats.setLastRefillCost(lastRecord.getCost());
        }
        
        // Calcular mÃ©tricas derivadas
        stats.calculateConsumptionPerKm();
        stats.calculateCostPerKm();
        stats.calculateAverageFuelPerRefill();
        stats.calculateAveragePricePerLiter();
        
        log.info("âœ… EstatÃ­sticas calculadas para {} no perÃ­odo: {} registros, {} litros, R$ {}", 
                driver.getName(), totalRecords, totalFuel, totalCost);
        
        return stats;
    }
    
    /**
     * Listar todos os motoristas
     */
    public List<DriverDTO> getAllDrivers() {
        log.info("ðŸ“‹ Listando todos os motoristas com registros de abastecimento");
        List<Driver> drivers = fuelRecordRepository.findAllDrivers();
        log.info("âœ… Encontrados {} motoristas", drivers.size());
        return drivers.stream().map(DriverDTO::fromEntity).collect(Collectors.toList());
    }
    
    /**
     * Buscar top motoristas por consumo de combustÃ­vel
     */
    public List<Object[]> getTopDriversByFuelConsumption() {
        log.info("ðŸ† Buscando top motoristas por consumo de combustÃ­vel");
        List<Object[]> topDrivers = fuelRecordRepository.getTopDriversByFuelConsumption();
        log.info("âœ… Encontrados {} motoristas", topDrivers.size());
        return topDrivers;
    }
    
    /**
     * Buscar top motoristas por custo
     */
    public List<Object[]> getTopDriversByCost() {
        log.info("ðŸ’° Buscando top motoristas por custo");
        List<Object[]> topDrivers = fuelRecordRepository.getTopDriversByCost();
        log.info("âœ… Encontrados {} motoristas", topDrivers.size());
        return topDrivers;
    }
    
    /**
     * Buscar estatÃ­sticas gerais por motorista
     */
    public List<Object[]> getFuelStatsByDriver() {
        log.info("ðŸ“Š Buscando estatÃ­sticas gerais por motorista");
        List<Object[]> stats = fuelRecordRepository.getFuelStatsByDriver();
        log.info("âœ… Encontradas estatÃ­sticas para {} motoristas", stats.size());
        return stats;
    }
    
    /**
     * Buscar consumo por motorista e tipo de combustÃ­vel
     */
    public List<Object[]> getFuelConsumptionByDriverAndType() {
        log.info("â›½ Buscando consumo por motorista e tipo de combustÃ­vel");
        List<Object[]> consumption = fuelRecordRepository.getFuelConsumptionByDriverAndType();
        log.info("âœ… Encontrados {} registros de consumo por tipo", consumption.size());
        return consumption;
    }
    
    /**
     * Buscar estatÃ­sticas de consumo de combustÃ­vel para todos os veÃ­culos
     */
    public List<VehicleFuelStatsDTO> getAllVehiclesStats() {
        log.info("ðŸ“Š Calculando estatÃ­sticas de consumo para todos os veÃ­culos...");
        
        List<Vehicle> vehicles = vehicleRepository.findAll();
        List<VehicleFuelStatsDTO> stats = new ArrayList<>();
        
        for (Vehicle vehicle : vehicles) {
            try {
                VehicleFuelStatsDTO vehicleStats = calculateVehicleStats(vehicle);
                if (vehicleStats.getTotalRecords() > 0) {
                    stats.add(vehicleStats);
                }
            } catch (Exception e) {
                log.warn("âš ï¸ Erro ao calcular estatÃ­sticas para veÃ­culo {}: {}", vehicle.getPlate(), e.getMessage());
            }
        }
        
        log.info("âœ… EstatÃ­sticas calculadas para {} veÃ­culos com registros", stats.size());
        return stats;
    }
    
    /**
     * Calcular estatÃ­sticas para um veÃ­culo especÃ­fico
     */
    private VehicleFuelStatsDTO calculateVehicleStats(Vehicle vehicle) {
        List<FuelRecord> fuelRecords = fuelRecordRepository.findByVehicleId(vehicle.getId());
        
        if (fuelRecords.isEmpty()) {
            return VehicleFuelStatsDTO.builder()
                    .vehicleId(vehicle.getId())
                    .vehiclePlate(vehicle.getPlate())
                    .vehicleModel(vehicle.getModel())
                    .vehicleBrand(vehicle.getBrand())
                    .totalRecords(0)
                    .totalFuelConsumed(BigDecimal.ZERO)
                    .totalCost(BigDecimal.ZERO)
                    .averageFuelPerRefill(BigDecimal.ZERO)
                    .averagePricePerLiter(BigDecimal.ZERO)
                    .consumptionPerKm(BigDecimal.ZERO)
                    .costPerKm(BigDecimal.ZERO)
                    .totalDistance(0)
                    .build();
        }
        
        // Ordenar registros por data para calcular quilometragem corretamente
        fuelRecords.sort(Comparator.comparing(FuelRecord::getDate));
        
        // Calcular totais
        BigDecimal totalFuelConsumed = fuelRecords.stream()
                .map(FuelRecord::getQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalCost = fuelRecords.stream()
                .map(FuelRecord::getCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Calcular distÃ¢ncia total
        int totalDistance = calculateTotalDistance(fuelRecords);
        
        // Calcular mÃ©dias
        BigDecimal averageFuelPerRefill = totalFuelConsumed.divide(
                BigDecimal.valueOf(fuelRecords.size()), 2, RoundingMode.HALF_UP);
        
        BigDecimal averagePricePerLiter = totalCost.divide(
                totalFuelConsumed, 2, RoundingMode.HALF_UP);
        
        // Calcular consumo por km e custo por km
        BigDecimal consumptionPerKm = BigDecimal.ZERO;
        BigDecimal costPerKm = BigDecimal.ZERO;
        
        if (totalDistance > 0) {
            consumptionPerKm = totalFuelConsumed.divide(
                    BigDecimal.valueOf(totalDistance), 4, RoundingMode.HALF_UP);
            costPerKm = totalCost.divide(
                    BigDecimal.valueOf(totalDistance), 2, RoundingMode.HALF_UP);
        }
        
        return VehicleFuelStatsDTO.builder()
                .vehicleId(vehicle.getId())
                .vehiclePlate(vehicle.getPlate())
                .vehicleModel(vehicle.getModel())
                .vehicleBrand(vehicle.getBrand())
                .totalRecords(fuelRecords.size())
                .totalFuelConsumed(totalFuelConsumed)
                .totalCost(totalCost)
                .averageFuelPerRefill(averageFuelPerRefill)
                .averagePricePerLiter(averagePricePerLiter)
                .consumptionPerKm(consumptionPerKm)
                .costPerKm(costPerKm)
                .totalDistance(totalDistance)
                .build();
    }
    
    /**
     * Calcular distÃ¢ncia total baseada na diferenÃ§a de quilometragem
     */
    private int calculateTotalDistance(List<FuelRecord> records) {
        if (records.size() < 2) return 0;
        
        // Ordenar por data
        records.sort((r1, r2) -> r1.getDate().compareTo(r2.getDate()));
        
        // Calcular diferenÃ§a entre primeira e Ãºltima quilometragem
        int firstMileage = records.get(0).getMileage();
        int lastMileage = records.get(records.size() - 1).getMileage();
        
        return Math.max(0, lastMileage - firstMileage);
    }
    
    /**
     * Buscar estatÃ­sticas por veÃ­culo para um motorista especÃ­fico
     */
    private List<DriverFuelConsumptionStatsDTO.VehicleStats> getVehicleStatsByDriver(String driverName) {
        log.info("ðŸš— Buscando estatÃ­sticas por veÃ­culo para motorista: {}", driverName);
        
        try {
            List<Object[]> vehicleStatsData = fuelRecordRepository.getFuelStatsByDriverAndVehicle();
            List<DriverFuelConsumptionStatsDTO.VehicleStats> vehicleStats = new ArrayList<>();
            
            for (Object[] data : vehicleStatsData) {
                try {
                    // Verificar se os dados sÃ£o vÃ¡lidos
                    if (data == null || data.length < 6) {
                        log.warn("âš ï¸ Dados invÃ¡lidos encontrados: {}", data);
                        continue;
                    }
                    
                    // Extrair dados com validaÃ§Ã£o de tipo
                    Object driverObj = data[0];
                    Object plateObj = data[1];
                    Object modelObj = data[2];
                    Object recordsCountObj = data[3];
                    Object totalFuelObj = data[4];
                    Object totalCostObj = data[5];
                    
                    // Verificar se o motorista corresponde
                    String driver = null;
                    if (driverObj instanceof String) {
                        driver = (String) driverObj;
                    } else if (driverObj != null) {
                        driver = driverObj.toString();
                    }
                    
                    if (driver == null || !driver.equals(driverName)) {
                        continue;
                    }
                    
                    // Extrair e validar dados do veÃ­culo
                    String plate = (plateObj != null) ? plateObj.toString() : "Placa nÃ£o informada";
                    String model = (modelObj != null) ? modelObj.toString() : "Modelo nÃ£o informado";
                    
                    // Converter contagem de registros
                    Integer recordsCount = 0;
                    if (recordsCountObj instanceof Number) {
                        recordsCount = ((Number) recordsCountObj).intValue();
                    } else if (recordsCountObj != null) {
                        try {
                            recordsCount = Integer.parseInt(recordsCountObj.toString());
                        } catch (NumberFormatException e) {
                            log.warn("âš ï¸ Erro ao converter contagem de registros: {}", recordsCountObj);
                        }
                    }
                    
                    // Converter combustÃ­vel total
                    BigDecimal totalFuel = BigDecimal.ZERO;
                    if (totalFuelObj instanceof Number) {
                        totalFuel = BigDecimal.valueOf(((Number) totalFuelObj).doubleValue());
                    } else if (totalFuelObj != null) {
                        try {
                            totalFuel = new BigDecimal(totalFuelObj.toString());
                        } catch (NumberFormatException e) {
                            log.warn("âš ï¸ Erro ao converter combustÃ­vel total: {}", totalFuelObj);
                        }
                    }
                    
                    // Converter custo total
                    BigDecimal totalCost = BigDecimal.ZERO;
                    if (totalCostObj instanceof Number) {
                        totalCost = BigDecimal.valueOf(((Number) totalCostObj).doubleValue());
                    } else if (totalCostObj != null) {
                        try {
                            totalCost = new BigDecimal(totalCostObj.toString());
                        } catch (NumberFormatException e) {
                            log.warn("âš ï¸ Erro ao converter custo total: {}", totalCostObj);
                        }
                    }
                    
                    // Criar estatÃ­sticas do veÃ­culo
                    DriverFuelConsumptionStatsDTO.VehicleStats stats = new DriverFuelConsumptionStatsDTO.VehicleStats(plate, model);
                    stats.setRecordsCount(recordsCount);
                    stats.setTotalFuel(totalFuel);
                    stats.setTotalCost(totalCost);
                    
                    // Calcular consumo mÃ©dio
                    if (recordsCount > 0 && totalFuel.compareTo(BigDecimal.ZERO) > 0) {
                        stats.setAverageConsumption(totalFuel.divide(BigDecimal.valueOf(recordsCount), 2, BigDecimal.ROUND_HALF_UP));
                    } else {
                        stats.setAverageConsumption(BigDecimal.ZERO);
                    }
                    
                    vehicleStats.add(stats);
                    log.debug("âœ… EstatÃ­sticas do veÃ­culo {} adicionadas: {} registros, {} litros, R$ {}", 
                             plate, recordsCount, totalFuel, totalCost);
                    
                } catch (Exception e) {
                    log.error("âŒ Erro ao processar dados do veÃ­culo: {}", e.getMessage(), e);
                    continue;
                }
            }
            
            log.info("âœ… Encontradas estatÃ­sticas para {} veÃ­culos do motorista {}", vehicleStats.size(), driverName);
            return vehicleStats;
            
        } catch (Exception e) {
            log.error("âŒ Erro ao buscar estatÃ­sticas por veÃ­culo para motorista {}: {}", driverName, e.getMessage(), e);
            return new ArrayList<>();
        }
    }
} 
