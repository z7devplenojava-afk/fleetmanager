package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.MileageRecordDTO;
import br.com.fleetmanager.model.MileageRecord;
import br.com.fleetmanager.model.Vehicle;
import br.com.fleetmanager.repository.MileageRecordRepository;
import br.com.fleetmanager.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class MileageRecordService {
    
    private final MileageRecordRepository mileageRecordRepository;
    private final VehicleRepository vehicleRepository;
    
    public List<MileageRecord> findAll() {
        return mileageRecordRepository.findAll();
    }
    
    public Page<MileageRecord> findAll(Pageable pageable) {
        return mileageRecordRepository.findAll(pageable);
    }
    
    public Optional<MileageRecord> findById(UUID id) {
        return mileageRecordRepository.findById(id);
    }
    
    public List<MileageRecord> findByVehicle(UUID vehicleId) {
        return mileageRecordRepository.findByVehicleId(vehicleId);
    }
    
    public Page<MileageRecord> findByVehicle(UUID vehicleId, Pageable pageable) {
        return mileageRecordRepository.findByVehicleId(vehicleId, pageable);
    }
    
    public List<MileageRecord> findByPeriod(LocalDate startDate, LocalDate endDate) {
        return mileageRecordRepository.findByDateBetween(startDate, endDate);
    }
    
    public List<MileageRecord> findByVehicleAndPeriod(UUID vehicleId, LocalDate startDate, LocalDate endDate) {
        return mileageRecordRepository.findByVehicleIdAndDateBetween(vehicleId, startDate, endDate);
    }
    
    public List<MileageRecord> findByDriver(String driver) {
        return mileageRecordRepository.findByDriverContainingIgnoreCase(driver);
    }
    
    public List<MileageRecord> findByTripType(MileageRecord.TripType tripType) {
        return mileageRecordRepository.findByTripType(tripType);
    }
    
    public List<MileageRecord> findByFuelType(MileageRecord.FuelType fuelType) {
        return mileageRecordRepository.findByFuelType(fuelType);
    }
    
    public List<MileageRecord> findByDestination(String destination) {
        return mileageRecordRepository.findByDestinationContainingIgnoreCase(destination);
    }
    
    public List<MileageRecord> findByPurpose(String purpose) {
        return mileageRecordRepository.findByPurposeContainingIgnoreCase(purpose);
    }
    
    public List<MileageRecord> findByLowConsumption(BigDecimal threshold) {
        return mileageRecordRepository.findByLowConsumption(threshold);
    }
    
    public List<MileageRecord> findByHighCostPerKm(BigDecimal threshold) {
        return mileageRecordRepository.findByHighCostPerKm(threshold);
    }
    
    public Page<MileageRecord> findByAdvancedFilters(UUID vehicleId, LocalDate startDate, LocalDate endDate,
                                                    MileageRecord.TripType tripType, MileageRecord.FuelType fuelType,
                                                    String driver, String destination, String purpose, Pageable pageable) {
        return mileageRecordRepository.findByAdvancedFilters(vehicleId, startDate, endDate, tripType, fuelType, driver, destination, purpose, pageable);
    }
    
    public MileageRecord create(MileageRecordDTO dto) {
        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Veículo não encontrado"));
        
        // Verificar se já existe registro para a data e veículo
        if (mileageRecordRepository.existsByVehicleAndDate(dto.getVehicleId(), dto.getDate())) {
            throw new RuntimeException("Já existe um registro para este veículo nesta data");
        }
        
        // Validar quilometragem
        validateMileage(vehicle, dto.getInitialMileage(), dto.getFinalMileage());
        
        MileageRecord record = new MileageRecord();
        updateRecordFromDTO(record, dto, vehicle);
        
        MileageRecord savedRecord = mileageRecordRepository.save(record);
        
        // Atualizar quilometragem atual do veículo
        updateVehicleMileage(vehicle, dto.getFinalMileage());
        
        return savedRecord;
    }
    
    public MileageRecord update(UUID id, MileageRecordDTO dto) {
        return mileageRecordRepository.findById(id)
                .map(record -> {
                    Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                            .orElseThrow(() -> new RuntimeException("Veículo não encontrado"));
                    
                    // Validar quilometragem
                    validateMileage(vehicle, dto.getInitialMileage(), dto.getFinalMileage());
                    
                    updateRecordFromDTO(record, dto, vehicle);
                    return mileageRecordRepository.save(record);
                })
                .orElseThrow(() -> new RuntimeException("Registro de quilometragem não encontrado"));
    }
    
    public void deleteById(UUID id) {
        mileageRecordRepository.deleteById(id);
    }
    
    // Métodos de estatísticas
    public Integer getTotalDistanceByVehicle(UUID vehicleId) {
        return mileageRecordRepository.getTotalDistanceByVehicle(vehicleId);
    }
    
    public BigDecimal getTotalFuelConsumedByVehicle(UUID vehicleId) {
        return mileageRecordRepository.getTotalFuelConsumedByVehicle(vehicleId);
    }
    
    public BigDecimal getTotalFuelCostByVehicle(UUID vehicleId) {
        return mileageRecordRepository.getTotalFuelCostByVehicle(vehicleId);
    }
    
    public BigDecimal getAverageConsumptionByVehicle(UUID vehicleId) {
        return mileageRecordRepository.getAverageConsumptionByVehicle(vehicleId);
    }
    
    public BigDecimal getAverageCostPerKmByVehicle(UUID vehicleId) {
        return mileageRecordRepository.getAverageCostPerKmByVehicle(vehicleId);
    }
    
    public Integer getTotalDistanceInPeriod(LocalDate startDate, LocalDate endDate) {
        return mileageRecordRepository.getTotalDistanceInPeriod(startDate, endDate);
    }
    
    public BigDecimal getTotalFuelConsumedInPeriod(LocalDate startDate, LocalDate endDate) {
        return mileageRecordRepository.getTotalFuelConsumedInPeriod(startDate, endDate);
    }
    
    public BigDecimal getTotalFuelCostInPeriod(LocalDate startDate, LocalDate endDate) {
        return mileageRecordRepository.getTotalFuelCostInPeriod(startDate, endDate);
    }
    
    // Relatórios
    public List<Object[]> getStatsByTripType() {
        return mileageRecordRepository.getStatsByTripType();
    }
    
    public List<Object[]> getStatsByFuelType() {
        return mileageRecordRepository.getStatsByFuelType();
    }
    
    public List<Object[]> getStatsByVehicle() {
        return mileageRecordRepository.getStatsByVehicle();
    }
    
    public List<Object[]> getStatsByDriver() {
        return mileageRecordRepository.getStatsByDriver();
    }
    
    public List<Object[]> getTopVehiclesByDistance() {
        return mileageRecordRepository.getTopVehiclesByDistance(Pageable.ofSize(10));
    }
    
    public List<Object[]> getTopVehiclesByConsumption() {
        return mileageRecordRepository.getTopVehiclesByConsumption(Pageable.ofSize(10));
    }
    
    public List<Object[]> getTopVehiclesByCostPerKm() {
        return mileageRecordRepository.getTopVehiclesByCostPerKm(Pageable.ofSize(10));
    }
    
    public List<MileageRecord> getLatestByVehicle(UUID vehicleId) {
        return mileageRecordRepository.findLatestByVehicle(vehicleId, Pageable.ofSize(1));
    }
    
    // Métodos auxiliares
    private void validateMileage(Vehicle vehicle, Integer initialMileage, Integer finalMileage) {
        if (initialMileage >= finalMileage) {
            throw new RuntimeException("Quilometragem final deve ser maior que a inicial");
        }
        
        if (initialMileage < vehicle.getCurrentMileage()) {
            throw new RuntimeException("Quilometragem inicial não pode ser menor que a atual do veículo");
        }
        
        int distance = finalMileage - initialMileage;
        if (distance > 1000) {
            throw new RuntimeException("Distância percorrida muito alta. Verifique os dados.");
        }
    }
    
    private void updateVehicleMileage(Vehicle vehicle, Integer newMileage) {
        vehicle.setCurrentMileage(newMileage);
        vehicleRepository.save(vehicle);
    }
    
    private void updateRecordFromDTO(MileageRecord record, MileageRecordDTO dto, Vehicle vehicle) {
        record.setVehicle(vehicle);
        record.setDate(dto.getDate());
        record.setInitialMileage(dto.getInitialMileage());
        record.setFinalMileage(dto.getFinalMileage());
        record.setDistanceTraveled(dto.getDistanceTraveled());
        record.setFuelConsumed(dto.getFuelConsumed());
        record.setFuelCost(dto.getFuelCost());
        record.setTripType(dto.getTripType());
        record.setFuelType(dto.getFuelType());
        record.setDriver(dto.getDriver());
        record.setDestination(dto.getDestination());
        record.setPurpose(dto.getPurpose());
        record.setNotes(dto.getNotes());
    }
} 