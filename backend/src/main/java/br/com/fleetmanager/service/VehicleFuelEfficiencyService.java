package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.VehicleFuelEfficiencyDTO;
import br.com.fleetmanager.model.FuelRecord;
import br.com.fleetmanager.model.Vehicle;
import br.com.fleetmanager.repository.FuelRecordRepository;
import br.com.fleetmanager.repository.VehicleRepository;
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
     * Buscar o veículo com melhor eficiência de combustível
     */
    public VehicleFuelEfficiencyDTO getMostEfficientVehicle() {
        log.info("🔍 Buscando veículo com melhor eficiência de combustível...");
        
        List<Vehicle> vehicles = vehicleRepository.findAll();
        if (vehicles.isEmpty()) {
            log.warn("⚠️ Nenhum veículo encontrado");
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
            
            log.info("✅ Veículo mais eficiente encontrado: {} ({}), Eficiência: {} km/L", 
                    bestEfficiency.getVehicleName(), 
                    mostEfficientVehicle.getPlate(),
                    bestEfficiency.getEfficiencyKmPerLiter());
        }
        
        return bestEfficiency != null ? bestEfficiency : createEmptyEfficiencyDTO();
    }
    
    /**
     * Calcular eficiência de combustível para um veículo específico
     */
    public VehicleFuelEfficiencyDTO calculateVehicleEfficiency(Vehicle vehicle) {
        log.debug("📊 Calculando eficiência para veículo: {} ({})", vehicle.getBrand() + " " + vehicle.getModel(), vehicle.getPlate());
        
        List<FuelRecord> fuelRecords = fuelRecordRepository.findByVehicleId(vehicle.getId());
        
        if (fuelRecords.isEmpty()) {
            log.debug("⚠️ Nenhum registro de combustível para veículo: {}", vehicle.getBrand() + " " + vehicle.getModel());
            return createEmptyEfficiencyDTO();
        }
        
        // Ordenar registros por data para calcular quilometragem corretamente
        fuelRecords.sort(Comparator.comparing(FuelRecord::getDate));
        
        // Calcular total de combustível consumido
        BigDecimal totalFuelConsumed = fuelRecords.stream()
                .map(FuelRecord::getQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Calcular custo total
        BigDecimal totalCost = fuelRecords.stream()
                .map(FuelRecord::getCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Calcular distância total percorrida
        int totalDistance = calculateTotalDistance(fuelRecords);
        
        if (totalDistance <= 0 || totalFuelConsumed.compareTo(BigDecimal.ZERO) <= 0) {
            log.debug("⚠️ Dados insuficientes para calcular eficiência do veículo: {}", vehicle.getBrand() + " " + vehicle.getModel());
            return createEmptyEfficiencyDTO();
        }
        
        // Calcular métricas de eficiência
        VehicleFuelEfficiencyDTO efficiency = new VehicleFuelEfficiencyDTO();
        efficiency.setVehicleId(vehicle.getId());
        efficiency.setVehiclePlate(vehicle.getPlate());
        efficiency.setVehicleName(vehicle.getBrand() + " " + vehicle.getModel());
        
        // Consumo em L/km
        BigDecimal consumptionPerKm = totalFuelConsumed
                .divide(BigDecimal.valueOf(totalDistance), 4, RoundingMode.HALF_UP);
        efficiency.setConsumptionLPerKm(consumptionPerKm);
        
        // Eficiência em km/L
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
        
        log.debug("✅ Eficiência calculada para {}: {} km/L, {} L/km, R$ {}/km", 
                vehicle.getBrand() + " " + vehicle.getModel(), efficiencyKmPerLiter, consumptionPerKm, costPerKm);
        
        return efficiency;
    }
    
    /**
     * Calcular distância total percorrida baseada nos registros de combustível
     */
    private int calculateTotalDistance(List<FuelRecord> fuelRecords) {
        if (fuelRecords.size() < 2) {
            return 0;
        }
        
        // Ordenar por data para garantir sequência correta
        fuelRecords.sort(Comparator.comparing(FuelRecord::getDate));
        
        int totalDistance = 0;
        for (int i = 1; i < fuelRecords.size(); i++) {
            FuelRecord current = fuelRecords.get(i);
            FuelRecord previous = fuelRecords.get(i - 1);
            
            // Calcular distância entre abastecimentos
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
     * Buscar estatísticas de eficiência para todos os veículos
     */
    public List<VehicleFuelEfficiencyDTO> getAllVehiclesEfficiency() {
        log.info("📊 Calculando eficiência para todos os veículos...");
        
        List<Vehicle> vehicles = vehicleRepository.findAll();
        
        return vehicles.stream()
                .map(this::calculateVehicleEfficiency)
                .filter(efficiency -> efficiency.getTotalDistance() > 0)
                .sorted(Comparator.comparing(VehicleFuelEfficiencyDTO::getEfficiencyKmPerLiter, 
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }
}
