package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.LocationDTO;
import com.z7design.fleet_manager.model.Location;
import com.z7design.fleet_manager.repository.LocationRepository;
import com.z7design.fleet_manager.repository.UnitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LocationService {
    
    private final LocationRepository locationRepository;
    private final UnitRepository unitRepository;
    
    @Transactional(readOnly = true)
    public List<LocationDTO> getAllLocations() {
        log.debug("Buscando todas as localizaÃ§Ãµes");
        try {
            List<Location> locations = locationRepository.findAll();
            log.debug("Encontradas {} localizaÃ§Ãµes", locations.size());
            return locations.stream()
                    .map(LocationDTO::fromEntity)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao buscar localizaÃ§Ãµes: ", e);
            throw new RuntimeException("Erro ao buscar localizaÃ§Ãµes: " + e.getMessage(), e);
        }
    }
    
    @Transactional(readOnly = true)
    public LocationDTO getLocationById(UUID id) {
        log.debug("Buscando localizaÃ§Ã£o por ID: {}", id);
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("LocalizaÃ§Ã£o nÃ£o encontrada com ID: " + id));
        return LocationDTO.fromEntity(location);
    }
    
    @Transactional(readOnly = true)
    public List<LocationDTO> getLocationsByUnitId(UUID unitId) {
        log.debug("Buscando localizaÃ§Ãµes por unidade ID: {}", unitId);
        try {
            List<Location> locations = locationRepository.findByUnitId(unitId);
            log.debug("Encontradas {} localizaÃ§Ãµes para a unidade {}", locations.size(), unitId);
            return locations.stream()
                    .map(LocationDTO::fromEntity)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao buscar localizaÃ§Ãµes por unidade: ", e);
            throw new RuntimeException("Erro ao buscar localizaÃ§Ãµes por unidade: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public LocationDTO createLocation(LocationDTO locationDTO) {
        log.debug("Criando nova localizaÃ§Ã£o: {}", locationDTO.getName());
        try {
            // Validar se a unidade existe
            if (locationDTO.getUnit() != null && locationDTO.getUnit().getId() != null) {
                unitRepository.findById(locationDTO.getUnit().getId())
                        .orElseThrow(() -> new RuntimeException("Unidade nÃ£o encontrada com ID: " + locationDTO.getUnit().getId()));
            }
            
            Location location = locationDTO.toEntity();
            Location savedLocation = locationRepository.save(location);
            log.debug("LocalizaÃ§Ã£o criada com sucesso: {}", savedLocation.getId());
            return LocationDTO.fromEntity(savedLocation);
        } catch (Exception e) {
            log.error("Erro ao criar localizaÃ§Ã£o: ", e);
            throw new RuntimeException("Erro ao criar localizaÃ§Ã£o: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public LocationDTO updateLocation(UUID id, LocationDTO locationDTO) {
        log.debug("Atualizando localizaÃ§Ã£o ID: {}", id);
        try {
            Location existingLocation = locationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("LocalizaÃ§Ã£o nÃ£o encontrada com ID: " + id));
            
            // Validar se a unidade existe
            if (locationDTO.getUnit() != null && locationDTO.getUnit().getId() != null) {
                unitRepository.findById(locationDTO.getUnit().getId())
                        .orElseThrow(() -> new RuntimeException("Unidade nÃ£o encontrada com ID: " + locationDTO.getUnit().getId()));
            }
            
            // Atualizar campos
            existingLocation.setName(locationDTO.getName());
            existingLocation.setDescription(locationDTO.getDescription());
            existingLocation.setAddress(locationDTO.getAddress());
            if (locationDTO.getUnit() != null) {
                existingLocation.setUnit(locationDTO.getUnit().toEntity());
            }
            
            Location savedLocation = locationRepository.save(existingLocation);
            log.debug("LocalizaÃ§Ã£o atualizada com sucesso: {}", savedLocation.getId());
            return LocationDTO.fromEntity(savedLocation);
        } catch (Exception e) {
            log.error("Erro ao atualizar localizaÃ§Ã£o: ", e);
            throw new RuntimeException("Erro ao atualizar localizaÃ§Ã£o: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public void deleteLocation(UUID id) {
        log.debug("Excluindo localizaÃ§Ã£o ID: {}", id);
        try {
            Location location = locationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("LocalizaÃ§Ã£o nÃ£o encontrada com ID: " + id));
            
            locationRepository.delete(location);
            log.debug("LocalizaÃ§Ã£o excluÃ­da com sucesso: {}", id);
        } catch (Exception e) {
            log.error("Erro ao excluir localizaÃ§Ã£o: ", e);
            throw new RuntimeException("Erro ao excluir localizaÃ§Ã£o: " + e.getMessage(), e);
        }
    }
}

