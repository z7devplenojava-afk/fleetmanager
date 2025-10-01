package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.CreateFuelStationDTO;
import br.com.fleetmanager.dto.FuelStationDTO;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.exception.BusinessException;
import br.com.fleetmanager.model.FuelStation;
import br.com.fleetmanager.repository.FuelStationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FuelStationService {
    
    private final FuelStationRepository fuelStationRepository;
    
    /**
     * Buscar todos os postos de combustível
     */
    public List<FuelStationDTO> getAllFuelStations() {
        log.info("🔍 Buscando todos os postos de combustível");
        List<FuelStation> stations = fuelStationRepository.findAll();
        log.info("✅ Encontrados {} postos de combustível", stations.size());
        return stations.stream()
                .map(FuelStationDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Buscar posto por ID
     */
    public FuelStationDTO getFuelStationById(UUID id) {
        log.info("🔍 Buscando posto de combustível com ID: {}", id);
        FuelStation station = fuelStationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Posto de combustível não encontrado com ID: " + id));
        log.info("✅ Posto encontrado: {}", station.getName());
        return FuelStationDTO.fromEntity(station);
    }
    
    /**
     * Buscar posto por nome
     */
    public FuelStationDTO getFuelStationByName(String name) {
        log.info("🔍 Buscando posto de combustível com nome: {}", name);
        FuelStation station = fuelStationRepository.findByNameIgnoreCase(name)
                .orElseThrow(() -> new ResourceNotFoundException("Posto de combustível não encontrado com nome: " + name));
        log.info("✅ Posto encontrado: {}", station.getName());
        return FuelStationDTO.fromEntity(station);
    }
    
    /**
     * Buscar postos por cidade
     */
    public List<FuelStationDTO> getFuelStationsByCity(String city) {
        log.info("🔍 Buscando postos de combustível na cidade: {}", city);
        List<FuelStation> stations = fuelStationRepository.findByCityIgnoreCase(city);
        log.info("✅ Encontrados {} postos na cidade {}", stations.size(), city);
        return stations.stream()
                .map(FuelStationDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Buscar postos por marca/bandeira
     */
    public List<FuelStationDTO> getFuelStationsByBrand(String brand) {
        log.info("🔍 Buscando postos de combustível da marca: {}", brand);
        List<FuelStation> stations = fuelStationRepository.findByBrandIgnoreCase(brand);
        log.info("✅ Encontrados {} postos da marca {}", stations.size(), brand);
        return stations.stream()
                .map(FuelStationDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Buscar postos ativos
     */
    public List<FuelStationDTO> getActiveFuelStations() {
        log.info("🔍 Buscando postos de combustível ativos");
        List<FuelStation> stations = fuelStationRepository.findByStatusOrderByNameAsc(FuelStation.FuelStationStatus.ACTIVE);
        log.info("✅ Encontrados {} postos ativos", stations.size());
        return stations.stream()
                .map(FuelStationDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Criar novo posto de combustível
     */
    @Transactional
    public FuelStationDTO createFuelStation(CreateFuelStationDTO dto) {
        log.info("🔍 Criando novo posto de combustível: {}", dto.getName());
        
        // Verificar se já existe posto com o mesmo nome
        if (fuelStationRepository.existsByNameIgnoreCase(dto.getName())) {
            throw new BusinessException("Já existe um posto cadastrado com este nome: " + dto.getName());
        }
        
        // Verificar se já existe posto com o mesmo CNPJ
        if (dto.getCnpj() != null && fuelStationRepository.existsByCnpj(dto.getCnpj())) {
            throw new BusinessException("Já existe um posto cadastrado com este CNPJ: " + dto.getCnpj());
        }
        
        FuelStation station = FuelStation.builder()
                .name(dto.getName())
                .address(dto.getAddress())
                .city(dto.getCity())
                .state(dto.getState())
                .zipCode(dto.getZipCode())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .cnpj(dto.getCnpj())
                .brand(dto.getBrand())
                .manager(dto.getManager())
                .managerPhone(dto.getManagerPhone())
                .managerEmail(dto.getManagerEmail())
                .operatingHours(dto.getOperatingHours())
                .services(dto.getServices())
                .paymentMethods(dto.getPaymentMethods())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .notes(dto.getNotes())
                .status(FuelStation.FuelStationStatus.ACTIVE)
                .build();
        
        FuelStation savedStation = fuelStationRepository.save(station);
        log.info("✅ Posto criado com sucesso: {} (ID: {})", savedStation.getName(), savedStation.getId());
        
        return FuelStationDTO.fromEntity(savedStation);
    }
    
    /**
     * Atualizar posto de combustível
     */
    @Transactional
    public FuelStationDTO updateFuelStation(UUID id, CreateFuelStationDTO dto) {
        log.info("🔍 Atualizando posto de combustível com ID: {}", id);
        
        FuelStation existingStation = fuelStationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Posto de combustível não encontrado com ID: " + id));
        
        // Verificar se o novo nome já existe em outro posto
        if (!existingStation.getName().equalsIgnoreCase(dto.getName()) && 
            fuelStationRepository.existsByNameIgnoreCase(dto.getName())) {
            throw new BusinessException("Já existe outro posto cadastrado com este nome: " + dto.getName());
        }
        
        // Verificar se o novo CNPJ já existe em outro posto
        if (dto.getCnpj() != null && !dto.getCnpj().equals(existingStation.getCnpj()) && 
            fuelStationRepository.existsByCnpj(dto.getCnpj())) {
            throw new BusinessException("Já existe outro posto cadastrado com este CNPJ: " + dto.getCnpj());
        }
        
        // Atualizar campos
        existingStation.setName(dto.getName());
        existingStation.setAddress(dto.getAddress());
        existingStation.setCity(dto.getCity());
        existingStation.setState(dto.getState());
        existingStation.setZipCode(dto.getZipCode());
        existingStation.setPhone(dto.getPhone());
        existingStation.setEmail(dto.getEmail());
        existingStation.setCnpj(dto.getCnpj());
        existingStation.setBrand(dto.getBrand());
        existingStation.setManager(dto.getManager());
        existingStation.setManagerPhone(dto.getManagerPhone());
        existingStation.setManagerEmail(dto.getManagerEmail());
        existingStation.setOperatingHours(dto.getOperatingHours());
        existingStation.setServices(dto.getServices());
        existingStation.setPaymentMethods(dto.getPaymentMethods());
        existingStation.setLatitude(dto.getLatitude());
        existingStation.setLongitude(dto.getLongitude());
        existingStation.setNotes(dto.getNotes());
        
        FuelStation updatedStation = fuelStationRepository.save(existingStation);
        log.info("✅ Posto atualizado com sucesso: {} (ID: {})", updatedStation.getName(), updatedStation.getId());
        
        return FuelStationDTO.fromEntity(updatedStation);
    }
    
    /**
     * Alterar status do posto
     */
    @Transactional
    public FuelStationDTO updateFuelStationStatus(UUID id, FuelStation.FuelStationStatus status) {
        log.info("🔍 Alterando status do posto {} para: {}", id, status);
        
        FuelStation station = fuelStationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Posto de combustível não encontrado com ID: " + id));
        
        station.setStatus(status);
        FuelStation updatedStation = fuelStationRepository.save(station);
        
        log.info("✅ Status do posto {} alterado para: {}", updatedStation.getName(), status);
        return FuelStationDTO.fromEntity(updatedStation);
    }
    
    /**
     * Excluir posto de combustível
     */
    @Transactional
    public void deleteFuelStation(UUID id) {
        log.info("🔍 Excluindo posto de combustível com ID: {}", id);
        
        FuelStation station = fuelStationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Posto de combustível não encontrado com ID: " + id));
        
        fuelStationRepository.delete(station);
        log.info("✅ Posto excluído com sucesso: {} (ID: {})", station.getName(), station.getId());
    }
    
    /**
     * Buscar postos próximos por coordenadas
     */
    public List<FuelStationDTO> getNearbyFuelStations(Double latitude, Double longitude, Double radius) {
        log.info("🔍 Buscando postos próximos às coordenadas ({}, {}) com raio de {} km", latitude, longitude, radius);
        
        List<FuelStation> stations = fuelStationRepository.findNearbyStations(latitude, longitude, radius);
        log.info("✅ Encontrados {} postos próximos", stations.size());
        
        return stations.stream()
                .map(FuelStationDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Obter estatísticas dos postos
     */
    public Object getFuelStationStats() {
        log.info("🔍 Buscando estatísticas dos postos de combustível");
        
        long totalStations = fuelStationRepository.count();
        long activeStations = fuelStationRepository.countByStatus(FuelStation.FuelStationStatus.ACTIVE);
        long inactiveStations = fuelStationRepository.countByStatus(FuelStation.FuelStationStatus.INACTIVE);
        long maintenanceStations = fuelStationRepository.countByStatus(FuelStation.FuelStationStatus.MAINTENANCE);
        long closedStations = fuelStationRepository.countByStatus(FuelStation.FuelStationStatus.CLOSED);
        
        return Map.of(
            "total", totalStations,
            "active", activeStations,
            "inactive", inactiveStations,
            "maintenance", maintenanceStations,
            "closed", closedStations
        );
    }
}
