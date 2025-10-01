package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.DriverFuelConsumptionStatsDTO;
import br.com.fleetmanager.dto.DriverDTO;
import br.com.fleetmanager.dto.VehicleFuelStatsDTO;
import br.com.fleetmanager.model.FuelRecord;
import br.com.fleetmanager.model.Driver;
import br.com.fleetmanager.model.Vehicle;
import br.com.fleetmanager.repository.FuelRecordRepository;
import br.com.fleetmanager.repository.DriverRepository;
import br.com.fleetmanager.repository.VehicleRepository;
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
     * Buscar estatísticas de consumo por motorista
     */
    public DriverFuelConsumptionStatsDTO getDriverStats(UUID driverId) {
        Driver driver = driverRepository.findById(driverId).orElseThrow(() -> new RuntimeException("Motorista não encontrado"));
        log.info("📊 Buscando estatísticas para motorista: {}", driver.getName());
        
        DriverFuelConsumptionStatsDTO stats = new DriverFuelConsumptionStatsDTO(driver.getName());
        
        // Buscar registros do motorista
        List<FuelRecord> records = fuelRecordRepository.findByDriverId(driverId);
        
        if (records.isEmpty()) {
            log.warn("⚠️ Nenhum registro encontrado para o motorista: {}", driver.getName());
            return stats;
        }
        
        // Calcular estatísticas básicas
        int totalRecords = records.size();
        BigDecimal totalFuel = records.stream()
                .map(FuelRecord::getQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCost = records.stream()
                .map(FuelRecord::getCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Calcular distância total (baseado na diferença de quilometragem)
        int totalDistance = calculateTotalDistance(records);
        
        // Último abastecimento
        FuelRecord lastRecord = records.stream()
                .max((r1, r2) -> r1.getDate().compareTo(r2.getDate()))
                .orElse(null);
        
        // Configurar estatísticas
        stats.setTotalRecords(totalRecords);
        stats.setTotalFuelConsumed(totalFuel);
        stats.setTotalCost(totalCost);
        stats.setTotalDistance(totalDistance);
        
        if (lastRecord != null) {
            stats.setLastRefillDate(lastRecord.getDate());
            stats.setLastRefillQuantity(lastRecord.getQuantity());
            stats.setLastRefillCost(lastRecord.getCost());
        }
        
        // Calcular métricas derivadas
        stats.calculateConsumptionPerKm();
        stats.calculateCostPerKm();
        stats.calculateAverageFuelPerRefill();
        stats.calculateAveragePricePerLiter();
        
        // Buscar estatísticas por veículo
        List<DriverFuelConsumptionStatsDTO.VehicleStats> vehicleStats = getVehicleStatsByDriver(driver.getName());
        stats.setVehiclesUsed(vehicleStats);
        
        log.info("✅ Estatísticas calculadas para {}: {} registros, {} litros, R$ {}", 
                driver.getName(), totalRecords, totalFuel, totalCost);
        
        return stats;
    }
    
    /**
     * Buscar estatísticas de consumo por motorista em período específico
     */
    public DriverFuelConsumptionStatsDTO getDriverStatsByPeriod(UUID driverId, LocalDate startDate, LocalDate endDate) {
        Driver driver = driverRepository.findById(driverId).orElseThrow(() -> new RuntimeException("Motorista não encontrado"));
        log.info("📊 Buscando estatísticas para motorista {} no período...", driver.getName());
        
        DriverFuelConsumptionStatsDTO stats = new DriverFuelConsumptionStatsDTO(driver.getName());
        
        // Buscar registros do motorista no período
        List<FuelRecord> records = fuelRecordRepository.findByDriverIdAndDateBetween(driverId, startDate, endDate);
        
        if (records.isEmpty()) {
            log.warn("⚠️ Nenhum registro encontrado para o motorista {} no período especificado", driver.getName());
            return stats;
        }
        
        // Calcular estatísticas básicas
        int totalRecords = records.size();
        BigDecimal totalFuel = records.stream()
                .map(FuelRecord::getQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCost = records.stream()
                .map(FuelRecord::getCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Calcular distância total
        int totalDistance = calculateTotalDistance(records);
        
        // Último abastecimento no período
        FuelRecord lastRecord = records.stream()
                .max((r1, r2) -> r1.getDate().compareTo(r2.getDate()))
                .orElse(null);
        
        // Configurar estatísticas
        stats.setTotalRecords(totalRecords);
        stats.setTotalFuelConsumed(totalFuel);
        stats.setTotalCost(totalCost);
        stats.setTotalDistance(totalDistance);
        
        if (lastRecord != null) {
            stats.setLastRefillDate(lastRecord.getDate());
            stats.setLastRefillQuantity(lastRecord.getQuantity());
            stats.setLastRefillCost(lastRecord.getCost());
        }
        
        // Calcular métricas derivadas
        stats.calculateConsumptionPerKm();
        stats.calculateCostPerKm();
        stats.calculateAverageFuelPerRefill();
        stats.calculateAveragePricePerLiter();
        
        log.info("✅ Estatísticas calculadas para {} no período: {} registros, {} litros, R$ {}", 
                driver.getName(), totalRecords, totalFuel, totalCost);
        
        return stats;
    }
    
    /**
     * Listar todos os motoristas
     */
    public List<DriverDTO> getAllDrivers() {
        log.info("📋 Listando todos os motoristas com registros de abastecimento");
        List<Driver> drivers = fuelRecordRepository.findAllDrivers();
        log.info("✅ Encontrados {} motoristas", drivers.size());
        return drivers.stream().map(DriverDTO::fromEntity).collect(Collectors.toList());
    }
    
    /**
     * Buscar top motoristas por consumo de combustível
     */
    public List<Object[]> getTopDriversByFuelConsumption() {
        log.info("🏆 Buscando top motoristas por consumo de combustível");
        List<Object[]> topDrivers = fuelRecordRepository.getTopDriversByFuelConsumption();
        log.info("✅ Encontrados {} motoristas", topDrivers.size());
        return topDrivers;
    }
    
    /**
     * Buscar top motoristas por custo
     */
    public List<Object[]> getTopDriversByCost() {
        log.info("💰 Buscando top motoristas por custo");
        List<Object[]> topDrivers = fuelRecordRepository.getTopDriversByCost();
        log.info("✅ Encontrados {} motoristas", topDrivers.size());
        return topDrivers;
    }
    
    /**
     * Buscar estatísticas gerais por motorista
     */
    public List<Object[]> getFuelStatsByDriver() {
        log.info("📊 Buscando estatísticas gerais por motorista");
        List<Object[]> stats = fuelRecordRepository.getFuelStatsByDriver();
        log.info("✅ Encontradas estatísticas para {} motoristas", stats.size());
        return stats;
    }
    
    /**
     * Buscar consumo por motorista e tipo de combustível
     */
    public List<Object[]> getFuelConsumptionByDriverAndType() {
        log.info("⛽ Buscando consumo por motorista e tipo de combustível");
        List<Object[]> consumption = fuelRecordRepository.getFuelConsumptionByDriverAndType();
        log.info("✅ Encontrados {} registros de consumo por tipo", consumption.size());
        return consumption;
    }
    
    /**
     * Buscar estatísticas de consumo de combustível para todos os veículos
     */
    public List<VehicleFuelStatsDTO> getAllVehiclesStats() {
        log.info("📊 Calculando estatísticas de consumo para todos os veículos...");
        
        List<Vehicle> vehicles = vehicleRepository.findAll();
        List<VehicleFuelStatsDTO> stats = new ArrayList<>();
        
        for (Vehicle vehicle : vehicles) {
            try {
                VehicleFuelStatsDTO vehicleStats = calculateVehicleStats(vehicle);
                if (vehicleStats.getTotalRecords() > 0) {
                    stats.add(vehicleStats);
                }
            } catch (Exception e) {
                log.warn("⚠️ Erro ao calcular estatísticas para veículo {}: {}", vehicle.getPlate(), e.getMessage());
            }
        }
        
        log.info("✅ Estatísticas calculadas para {} veículos com registros", stats.size());
        return stats;
    }
    
    /**
     * Calcular estatísticas para um veículo específico
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
        
        // Calcular distância total
        int totalDistance = calculateTotalDistance(fuelRecords);
        
        // Calcular médias
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
     * Calcular distância total baseada na diferença de quilometragem
     */
    private int calculateTotalDistance(List<FuelRecord> records) {
        if (records.size() < 2) return 0;
        
        // Ordenar por data
        records.sort((r1, r2) -> r1.getDate().compareTo(r2.getDate()));
        
        // Calcular diferença entre primeira e última quilometragem
        int firstMileage = records.get(0).getMileage();
        int lastMileage = records.get(records.size() - 1).getMileage();
        
        return Math.max(0, lastMileage - firstMileage);
    }
    
    /**
     * Buscar estatísticas por veículo para um motorista específico
     */
    private List<DriverFuelConsumptionStatsDTO.VehicleStats> getVehicleStatsByDriver(String driverName) {
        log.info("🚗 Buscando estatísticas por veículo para motorista: {}", driverName);
        
        try {
            List<Object[]> vehicleStatsData = fuelRecordRepository.getFuelStatsByDriverAndVehicle();
            List<DriverFuelConsumptionStatsDTO.VehicleStats> vehicleStats = new ArrayList<>();
            
            for (Object[] data : vehicleStatsData) {
                try {
                    // Verificar se os dados são válidos
                    if (data == null || data.length < 6) {
                        log.warn("⚠️ Dados inválidos encontrados: {}", data);
                        continue;
                    }
                    
                    // Extrair dados com validação de tipo
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
                    
                    // Extrair e validar dados do veículo
                    String plate = (plateObj != null) ? plateObj.toString() : "Placa não informada";
                    String model = (modelObj != null) ? modelObj.toString() : "Modelo não informado";
                    
                    // Converter contagem de registros
                    Integer recordsCount = 0;
                    if (recordsCountObj instanceof Number) {
                        recordsCount = ((Number) recordsCountObj).intValue();
                    } else if (recordsCountObj != null) {
                        try {
                            recordsCount = Integer.parseInt(recordsCountObj.toString());
                        } catch (NumberFormatException e) {
                            log.warn("⚠️ Erro ao converter contagem de registros: {}", recordsCountObj);
                        }
                    }
                    
                    // Converter combustível total
                    BigDecimal totalFuel = BigDecimal.ZERO;
                    if (totalFuelObj instanceof Number) {
                        totalFuel = BigDecimal.valueOf(((Number) totalFuelObj).doubleValue());
                    } else if (totalFuelObj != null) {
                        try {
                            totalFuel = new BigDecimal(totalFuelObj.toString());
                        } catch (NumberFormatException e) {
                            log.warn("⚠️ Erro ao converter combustível total: {}", totalFuelObj);
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
                            log.warn("⚠️ Erro ao converter custo total: {}", totalCostObj);
                        }
                    }
                    
                    // Criar estatísticas do veículo
                    DriverFuelConsumptionStatsDTO.VehicleStats stats = new DriverFuelConsumptionStatsDTO.VehicleStats(plate, model);
                    stats.setRecordsCount(recordsCount);
                    stats.setTotalFuel(totalFuel);
                    stats.setTotalCost(totalCost);
                    
                    // Calcular consumo médio
                    if (recordsCount > 0 && totalFuel.compareTo(BigDecimal.ZERO) > 0) {
                        stats.setAverageConsumption(totalFuel.divide(BigDecimal.valueOf(recordsCount), 2, BigDecimal.ROUND_HALF_UP));
                    } else {
                        stats.setAverageConsumption(BigDecimal.ZERO);
                    }
                    
                    vehicleStats.add(stats);
                    log.debug("✅ Estatísticas do veículo {} adicionadas: {} registros, {} litros, R$ {}", 
                             plate, recordsCount, totalFuel, totalCost);
                    
                } catch (Exception e) {
                    log.error("❌ Erro ao processar dados do veículo: {}", e.getMessage(), e);
                    continue;
                }
            }
            
            log.info("✅ Encontradas estatísticas para {} veículos do motorista {}", vehicleStats.size(), driverName);
            return vehicleStats;
            
        } catch (Exception e) {
            log.error("❌ Erro ao buscar estatísticas por veículo para motorista {}: {}", driverName, e.getMessage(), e);
            return new ArrayList<>();
        }
    }
} 