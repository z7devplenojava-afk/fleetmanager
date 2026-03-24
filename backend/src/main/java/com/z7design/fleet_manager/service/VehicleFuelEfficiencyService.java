package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.VehicleFuelEfficiencyDTO;
import com.z7design.fleet_manager.model.FuelRecord;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.FuelRecordRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleFuelEfficiencyService {
    
    private final FuelRecordRepository fuelRecordRepository;
    private final VehicleRepository vehicleRepository;
    
    /**
     * Buscar o veÃ­culo com melhor eficiÃªncia de combustÃ­vel
     */
    public VehicleFuelEfficiencyDTO getMostEfficientVehicle() {
        log.info("ðŸ” Buscando veÃ­culo com melhor eficiÃªncia de combustÃ­vel...");
        
        List<Vehicle> vehicles = vehicleRepository.findAll();
        if (vehicles.isEmpty()) {
            log.warn("âš ï¸ Nenhum veÃ­culo encontrado");
            return createEmptyEfficiencyDTO();
        }
        
        Vehicle mostEfficientVehicle = null;
        VehicleFuelEfficiencyDTO bestEfficiency = null;
        
        for (Vehicle vehicle : vehicles) {
            VehicleFuelEfficiencyDTO efficiency = calculateVehicleEfficiency(vehicle);
            
            if (bestEfficiency == null || 
                (efficiency.getEfficiencyKmPerLiter() != null && 
                 bestEfficiency.getEfficiencyKmPerLiter() != null &&
                 efficiency.getEfficiencyKmPerLiter().compareTo(bestEfficiency.getEfficiencyKmPerLiter()) > 0)) {
                bestEfficiency = efficiency;
                mostEfficientVehicle = vehicle;
            }
        }
        
        if (bestEfficiency != null && mostEfficientVehicle != null) {
            bestEfficiency.setVehicleId(mostEfficientVehicle.getId());
            bestEfficiency.setVehiclePlate(mostEfficientVehicle.getPlate());
            bestEfficiency.setVehicleName(mostEfficientVehicle.getBrand() + " " + mostEfficientVehicle.getModel());
            
            log.info("âœ… VeÃ­culo mais eficiente encontrado: {} ({}), EficiÃªncia: {} km/L", 
                    bestEfficiency.getVehicleName(), 
                    mostEfficientVehicle.getPlate(),
                    bestEfficiency.getEfficiencyKmPerLiter());
        }
        
        return bestEfficiency != null ? bestEfficiency : createEmptyEfficiencyDTO();
    }
    
    /**
     * Calcular eficiÃªncia de combustÃ­vel para um veÃ­culo especÃ­fico
     */
    public VehicleFuelEfficiencyDTO calculateVehicleEfficiency(Vehicle vehicle) {
        log.debug("ðŸ“Š Calculando eficiÃªncia para veÃ­culo: {} ({})", vehicle.getBrand() + " " + vehicle.getModel(), vehicle.getPlate());
        
        List<FuelRecord> fuelRecords = fuelRecordRepository.findByVehicleId(vehicle.getId());
        
        if (fuelRecords.isEmpty()) {
            log.debug("âš ï¸ Nenhum registro de combustÃ­vel para veÃ­culo: {}", vehicle.getBrand() + " " + vehicle.getModel());
            return createEmptyEfficiencyDTO();
        }
        
        // Ordenar registros por data para calcular quilometragem corretamente
        fuelRecords.sort(Comparator.comparing(FuelRecord::getDate));
        
        // Calcular total de combustÃ­vel consumido
        BigDecimal totalFuelConsumed = fuelRecords.stream()
                .map(FuelRecord::getQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Calcular custo total
        BigDecimal totalCost = fuelRecords.stream()
                .map(FuelRecord::getCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Calcular distÃ¢ncia total percorrida
        int totalDistance = calculateTotalDistance(fuelRecords);
        
        if (totalDistance <= 0 || totalFuelConsumed.compareTo(BigDecimal.ZERO) <= 0) {
            log.debug("âš ï¸ Dados insuficientes para calcular eficiÃªncia do veÃ­culo: {}", vehicle.getBrand() + " " + vehicle.getModel());
            return createEmptyEfficiencyDTO();
        }
        
        // Calcular mÃ©tricas de eficiÃªncia
        VehicleFuelEfficiencyDTO efficiency = new VehicleFuelEfficiencyDTO();
        efficiency.setVehicleId(vehicle.getId());
        efficiency.setVehiclePlate(vehicle.getPlate());
        efficiency.setVehicleName(vehicle.getBrand() + " " + vehicle.getModel());
        
        // Consumo em L/km
        BigDecimal consumptionPerKm = totalFuelConsumed
                .divide(BigDecimal.valueOf(totalDistance), 4, RoundingMode.HALF_UP);
        efficiency.setConsumptionLPerKm(consumptionPerKm);
        
        // EficiÃªncia em km/L
        BigDecimal efficiencyKmPerLiter = BigDecimal.valueOf(totalDistance)
                .divide(totalFuelConsumed, 2, RoundingMode.HALF_UP);
        efficiency.setEfficiencyKmPerLiter(efficiencyKmPerLiter);
        
        // Custo por km
        BigDecimal costPerKm = totalCost
                .divide(BigDecimal.valueOf(totalDistance), 2, RoundingMode.HALF_UP);
        efficiency.setCostPerKm(costPerKm);
        
        // Dados adicionais
        efficiency.setTotalFuelConsumed(totalFuelConsumed);
        efficiency.setTotalCost(totalCost);
        efficiency.setTotalDistance(totalDistance);
        efficiency.setTotalRecords(fuelRecords.size());
        
        log.debug("âœ… EficiÃªncia calculada para {}: {} km/L, {} L/km, R$ {}/km", 
                vehicle.getBrand() + " " + vehicle.getModel(), efficiencyKmPerLiter, consumptionPerKm, costPerKm);
        
        return efficiency;
    }
    
    /**
     * Calcular distÃ¢ncia total percorrida baseada nos registros de combustÃ­vel
     */
    private int calculateTotalDistance(List<FuelRecord> fuelRecords) {
        if (fuelRecords.size() < 2) {
            return 0;
        }
        
        // Ordenar por data para garantir sequÃªncia correta
        fuelRecords.sort(Comparator.comparing(FuelRecord::getDate));
        
        int totalDistance = 0;
        for (int i = 1; i < fuelRecords.size(); i++) {
            FuelRecord current = fuelRecords.get(i);
            FuelRecord previous = fuelRecords.get(i - 1);
            
            // Calcular distÃ¢ncia entre abastecimentos
            if (current.getMileage() != null && previous.getMileage() != null) {
                int distance = current.getMileage() - previous.getMileage();
                if (distance > 0) {
                    totalDistance += distance;
                }
            }
        }
        
        return totalDistance;
    }
    
    /**
     * Criar DTO vazio para casos sem dados
     */
    private VehicleFuelEfficiencyDTO createEmptyEfficiencyDTO() {
        VehicleFuelEfficiencyDTO empty = new VehicleFuelEfficiencyDTO();
        empty.setConsumptionLPerKm(BigDecimal.ZERO);
        empty.setEfficiencyKmPerLiter(BigDecimal.ZERO);
        empty.setCostPerKm(BigDecimal.ZERO);
        empty.setTotalFuelConsumed(BigDecimal.ZERO);
        empty.setTotalCost(BigDecimal.ZERO);
        empty.setTotalDistance(0);
        empty.setTotalRecords(0);
        return empty;
    }
    
    /**
     * Buscar estatÃ­sticas de eficiÃªncia para todos os veÃ­culos
     */
    public List<VehicleFuelEfficiencyDTO> getAllVehiclesEfficiency() {
        log.info("ðŸ“Š Calculando eficiÃªncia para todos os veÃ­culos...");
        
        List<Vehicle> vehicles = vehicleRepository.findAll();
        
        return vehicles.stream()
                .map(this::calculateVehicleEfficiency)
                .filter(efficiency -> efficiency.getTotalDistance() > 0)
                .sorted(Comparator.comparing(VehicleFuelEfficiencyDTO::getEfficiencyKmPerLiter, 
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }
}

