package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.VehicleDTO;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleService {
    
    private final VehicleRepository vehicleRepository;
    
    @Transactional(readOnly = true)
    public List<VehicleDTO> getAllVehicles() {
        log.debug("Buscando todos os veÃ­culos");
        try {
            List<Vehicle> vehicles = vehicleRepository.findAll();
            log.debug("Encontrados {} veÃ­culos", vehicles.size());
            return vehicles.stream()
                    .map(VehicleDTO::fromEntity)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao buscar veÃ­culos: ", e);
            throw new RuntimeException("Erro ao buscar veÃ­culos: " + e.getMessage(), e);
        }
    }
    
    @Transactional(readOnly = true)
    public VehicleDTO getVehicleById(UUID id) {
        log.debug("Buscando veÃ­culo por ID: {}", id);
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("VeÃ­culo nÃ£o encontrado com ID: " + id));
        return VehicleDTO.fromEntity(vehicle);
    }
    
    @Transactional(readOnly = true)
    public Optional<VehicleDTO> getVehicleByPlate(String plate) {
        log.debug("Buscando veÃ­culo por placa: {}", plate);
        Optional<Vehicle> vehicle = vehicleRepository.findByPlate(plate);
        return vehicle.map(VehicleDTO::fromEntity);
    }
    
    @Transactional(readOnly = true)
    public List<VehicleDTO> getVehiclesByStatus(Vehicle.VehicleStatus status) {
        log.debug("Buscando veÃ­culos por status: {}", status);
        try {
            List<Vehicle> vehicles = vehicleRepository.findByStatus(status);
            log.debug("Encontrados {} veÃ­culos com status {}", vehicles.size(), status);
            return vehicles.stream()
                    .map(VehicleDTO::fromEntity)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao buscar veÃ­culos por status: ", e);
            throw new RuntimeException("Erro ao buscar veÃ­culos por status: " + e.getMessage(), e);
        }
    }
    
    @Transactional(readOnly = true)
    public List<VehicleDTO> searchVehicles(String searchTerm) {
        log.debug("Buscando veÃ­culos com termo: {}", searchTerm);
        try {
            List<Vehicle> vehicles = vehicleRepository.findBySearchTerm(searchTerm);
            log.debug("Encontrados {} veÃ­culos para o termo '{}'", vehicles.size(), searchTerm);
            return vehicles.stream()
                    .map(VehicleDTO::fromEntity)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao buscar veÃ­culos: ", e);
            throw new RuntimeException("Erro ao buscar veÃ­culos: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public VehicleDTO createVehicle(VehicleDTO vehicleDTO) {
        log.debug("Criando novo veÃ­culo: {}", vehicleDTO.getPlate());
        try {
            // Validar se a placa jÃ¡ existe
            if (vehicleRepository.existsByPlate(vehicleDTO.getPlate())) {
                throw new RuntimeException("JÃ¡ existe um veÃ­culo com a placa: " + vehicleDTO.getPlate());
            }
            
            Vehicle vehicle = vehicleDTO.toEntity();
            Vehicle savedVehicle = vehicleRepository.save(vehicle);
            log.debug("VeÃ­culo criado com sucesso: {}", savedVehicle.getId());
            return VehicleDTO.fromEntity(savedVehicle);
        } catch (Exception e) {
            log.error("Erro ao criar veÃ­culo: ", e);
            throw new RuntimeException("Erro ao criar veÃ­culo: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public VehicleDTO updateVehicle(UUID id, VehicleDTO vehicleDTO) {
        log.debug("Atualizando veÃ­culo ID: {}", id);
        try {
            Vehicle existingVehicle = vehicleRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("VeÃ­culo nÃ£o encontrado com ID: " + id));
            
            // Validar se a placa jÃ¡ existe em outro veÃ­culo
            if (!existingVehicle.getPlate().equals(vehicleDTO.getPlate()) && 
                vehicleRepository.existsByPlate(vehicleDTO.getPlate())) {
                throw new RuntimeException("JÃ¡ existe um veÃ­culo com a placa: " + vehicleDTO.getPlate());
            }
            
            // Atualizar campos
            existingVehicle.setPlate(vehicleDTO.getPlate());
            existingVehicle.setModel(vehicleDTO.getModel());
            existingVehicle.setBrand(vehicleDTO.getBrand());
            existingVehicle.setYear(vehicleDTO.getYear());
            existingVehicle.setColor(vehicleDTO.getColor());
            existingVehicle.setStatus(vehicleDTO.getStatus());
            existingVehicle.setFuelType(vehicleDTO.getFuelType());
            existingVehicle.setCapacity(vehicleDTO.getCapacity());
            existingVehicle.setCurrentMileage(vehicleDTO.getCurrentMileage());
            existingVehicle.setInitialMileage(vehicleDTO.getInitialMileage());
            existingVehicle.setAssignedDriver(vehicleDTO.getAssignedDriver());
            existingVehicle.setResponsibleEmployeeId(vehicleDTO.getResponsibleEmployeeId());
            existingVehicle.setDepartment(vehicleDTO.getDepartment());
            existingVehicle.setLocation(vehicleDTO.getLocation());
            existingVehicle.setAcquisitionDate(vehicleDTO.getAcquisitionDate());
            existingVehicle.setAcquisitionValue(vehicleDTO.getAcquisitionValue());
            existingVehicle.setAverageConsumption(vehicleDTO.getAverageConsumption());
            existingVehicle.setAverageCostPerKm(vehicleDTO.getAverageCostPerKm());
            existingVehicle.setLastMaintenanceDate(vehicleDTO.getLastMaintenanceDate());
            existingVehicle.setNextMaintenanceDate(vehicleDTO.getNextMaintenanceDate());
            existingVehicle.setInsuranceExpiryDate(vehicleDTO.getInsuranceExpiryDate());
            existingVehicle.setDocumentationExpiryDate(vehicleDTO.getDocumentationExpiryDate());
            existingVehicle.setNotes(vehicleDTO.getNotes());
            existingVehicle.setPhotos(vehicleDTO.getPhotos());

            // Campos de Ônibus
            existingVehicle.setVehicleType(vehicleDTO.getVehicleType());
            existingVehicle.setBusType(vehicleDTO.getBusType());
            existingVehicle.setPassengerCapacity(vehicleDTO.getPassengerCapacity());
            existingVehicle.setStandingCapacity(vehicleDTO.getStandingCapacity());
            existingVehicle.setTotalDoors(vehicleDTO.getTotalDoors());
            existingVehicle.setHasAccessibility(vehicleDTO.getHasAccessibility());
            existingVehicle.setHasAirConditioning(vehicleDTO.getHasAirConditioning());
            existingVehicle.setHasWiFi(vehicleDTO.getHasWiFi());
            existingVehicle.setHasCamera(vehicleDTO.getHasCamera());
            existingVehicle.setHasCctv(vehicleDTO.getHasCctv());
            existingVehicle.setBusBodyType(vehicleDTO.getBusBodyType());
            existingVehicle.setChassisBrand(vehicleDTO.getChassisBrand());
            existingVehicle.setBodyBuilder(vehicleDTO.getBodyBuilder());
            existingVehicle.setEngineModel(vehicleDTO.getEngineModel());
            existingVehicle.setEnginePowerHp(vehicleDTO.getEnginePowerHp());
            existingVehicle.setTransmissionType(vehicleDTO.getTransmissionType());
            existingVehicle.setAxleCount(vehicleDTO.getAxleCount());
            existingVehicle.setTotalWeightKg(vehicleDTO.getTotalWeightKg());
            existingVehicle.setPayloadKg(vehicleDTO.getPayloadKg());
            existingVehicle.setFuelTankCapacityLiters(vehicleDTO.getFuelTankCapacityLiters());
            existingVehicle.setRouteNumber(vehicleDTO.getRouteNumber());
            existingVehicle.setRouteName(vehicleDTO.getRouteName());
            
            Vehicle savedVehicle = vehicleRepository.save(existingVehicle);
            log.debug("VeÃ­culo atualizado com sucesso: {}", savedVehicle.getId());
            return VehicleDTO.fromEntity(savedVehicle);
        } catch (Exception e) {
            log.error("Erro ao atualizar veÃ­culo: ", e);
            throw new RuntimeException("Erro ao atualizar veÃ­culo: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public void deleteVehicle(UUID id) {
        log.debug("Excluindo veÃ­culo ID: {}", id);
        try {
            Vehicle vehicle = vehicleRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("VeÃ­culo nÃ£o encontrado com ID: " + id));
            
            vehicleRepository.delete(vehicle);
            log.debug("VeÃ­culo excluÃ­do com sucesso: {}", id);
        } catch (Exception e) {
            log.error("Erro ao excluir veÃ­culo: ", e);
            throw new RuntimeException("Erro ao excluir veÃ­culo: " + e.getMessage(), e);
        }
    }
    
    @Transactional(readOnly = true)
    public long count() {
        return vehicleRepository.count();
    }
}

