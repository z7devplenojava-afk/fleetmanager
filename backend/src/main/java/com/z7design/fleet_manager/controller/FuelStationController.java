package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.CreateFuelStationDTO;
import com.z7design.fleet_manager.dto.FuelStationDTO;
import com.z7design.fleet_manager.service.FuelStationService;
import com.z7design.fleet_manager.model.FuelStation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import com.z7design.fleet_manager.repository.FuelStationRepository;

@RestController
@RequestMapping("/api/fuel-stations")
@RequiredArgsConstructor
@Slf4j
public class FuelStationController {
    
    private final FuelStationService fuelStationService;
    private final FuelStationRepository fuelStationRepository;
    
    /**
     * Buscar todos os postos de combustÃ­vel
     */
    @GetMapping
    public ResponseEntity<List<FuelStationDTO>> getAllFuelStations() {
        log.info("ðŸ” GET /api/fuel-stations - Buscando todos os postos");
        List<FuelStationDTO> stations = fuelStationService.getAllFuelStations();
        log.info("âœ… Retornando {} postos de combustÃ­vel", stations.size());
        return ResponseEntity.ok(stations);
    }
    
    /**
     * Buscar posto por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<FuelStationDTO> getFuelStationById(@PathVariable("id") UUID id) {
        log.info("ðŸ” GET /api/fuel-stations/{} - Buscando posto por ID", id);
        FuelStationDTO station = fuelStationService.getFuelStationById(id);
        log.info("âœ… Posto encontrado: {}", station.getName());
        return ResponseEntity.ok(station);
    }
    
    /**
     * Buscar posto por nome
     */
    @GetMapping("/name/{name}")
    public ResponseEntity<FuelStationDTO> getFuelStationByName(@PathVariable("name") String name) {
        log.info("ðŸ” GET /api/fuel-stations/name/{} - Buscando posto por nome", name);
        FuelStationDTO station = fuelStationService.getFuelStationByName(name);
        log.info("âœ… Posto encontrado: {}", station.getName());
        return ResponseEntity.ok(station);
    }
    
    /**
     * Buscar postos por cidade
     */
    @GetMapping("/city/{city}")
    public ResponseEntity<List<FuelStationDTO>> getFuelStationsByCity(@PathVariable("city") String city) {
        log.info("ðŸ” GET /api/fuel-stations/city/{} - Buscando postos por cidade", city);
        List<FuelStationDTO> stations = fuelStationService.getFuelStationsByCity(city);
        log.info("âœ… Encontrados {} postos na cidade {}", stations.size(), city);
        return ResponseEntity.ok(stations);
    }
    
    /**
     * Buscar postos por marca/bandeira
     */
    @GetMapping("/brand/{brand}")
    public ResponseEntity<List<FuelStationDTO>> getFuelStationsByBrand(@PathVariable("brand") String brand) {
        log.info("ðŸ” GET /api/fuel-stations/brand/{} - Buscando postos por marca", brand);
        List<FuelStationDTO> stations = fuelStationService.getFuelStationsByBrand(brand);
        log.info("âœ… Encontrados {} postos da marca {}", stations.size(), brand);
        return ResponseEntity.ok(stations);
    }
    
    /**
     * Buscar postos ativos
     */
    @GetMapping("/active")
    public ResponseEntity<List<FuelStationDTO>> getActiveFuelStations() {
        log.info("ðŸ” GET /api/fuel-stations/active - Buscando postos ativos");
        List<FuelStationDTO> stations = fuelStationService.getActiveFuelStations();
        log.info("âœ… Encontrados {} postos ativos", stations.size());
        return ResponseEntity.ok(stations);
    }
    
    /**
     * Buscar postos prÃ³ximos por coordenadas
     */
    @GetMapping("/nearby")
    public ResponseEntity<List<FuelStationDTO>> getNearbyFuelStations(
            @RequestParam(value = "latitude") Double latitude,
            @RequestParam(value = "longitude") Double longitude,
            @RequestParam(value = "radius", defaultValue = "10.0") Double radius) {
        log.info("ðŸ” GET /api/fuel-stations/nearby - Buscando postos prÃ³ximos Ã s coordenadas ({}, {}) com raio {} km", 
                latitude, longitude, radius);
        List<FuelStationDTO> stations = fuelStationService.getNearbyFuelStations(latitude, longitude, radius);
        log.info("âœ… Encontrados {} postos prÃ³ximos", stations.size());
        return ResponseEntity.ok(stations);
    }
    
    /**
     * Obter estatÃ­sticas dos postos
     */
    @GetMapping("/stats")
    public ResponseEntity<Object> getFuelStationStats() {
        log.info("ðŸ” GET /api/fuel-stations/stats - Buscando estatÃ­sticas dos postos");
        Object stats = fuelStationService.getFuelStationStats();
        log.info("âœ… EstatÃ­sticas retornadas: {}", stats);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Criar novo posto de combustÃ­vel
     */
    @PostMapping
    public ResponseEntity<FuelStationDTO> createFuelStation(@Valid @RequestBody CreateFuelStationDTO dto) {
        log.info("ðŸ” POST /api/fuel-stations - Criando novo posto: {}", dto.getName());
        FuelStationDTO createdStation = fuelStationService.createFuelStation(dto);
        log.info("âœ… Posto criado com sucesso: {} (ID: {})", createdStation.getName(), createdStation.getId());
        return ResponseEntity.ok(createdStation);
    }
    
    /**
     * Atualizar posto de combustÃ­vel
     */
    @PutMapping("/{id}")
    public ResponseEntity<FuelStationDTO> updateFuelStation(
            @PathVariable("id") UUID id, 
            @Valid @RequestBody CreateFuelStationDTO dto) {
        log.info("ðŸ” PUT /api/fuel-stations/{} - Atualizando posto", id);
        FuelStationDTO updatedStation = fuelStationService.updateFuelStation(id, dto);
        log.info("âœ… Posto atualizado com sucesso: {} (ID: {})", updatedStation.getName(), updatedStation.getId());
        return ResponseEntity.ok(updatedStation);
    }
    
    /**
     * Alterar status do posto
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<FuelStationDTO> updateFuelStationStatus(
            @PathVariable("id") UUID id, 
            @RequestParam(value = "status") FuelStation.FuelStationStatus status) {
        log.info("ðŸ” PATCH /api/fuel-stations/{}/status - Alterando status para: {}", id, status);
        FuelStationDTO updatedStation = fuelStationService.updateFuelStationStatus(id, status);
        log.info("âœ… Status do posto {} alterado para: {}", updatedStation.getName(), status);
        return ResponseEntity.ok(updatedStation);
    }
    
    /**
     * Excluir posto de combustÃ­vel
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFuelStation(@PathVariable("id") UUID id) {
        log.info("ðŸ” DELETE /api/fuel-stations/{} - Excluindo posto", id);
        fuelStationService.deleteFuelStation(id);
        log.info("âœ… Posto excluÃ­do com sucesso (ID: {})", id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Endpoint de teste
     */
    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint() {
        return ResponseEntity.ok("Endpoint de postos de combustÃ­vel funcionando!");
    }
    
    /**
     * Endpoint de teste para verificar dados
     */
    @GetMapping("/test-data")
    public ResponseEntity<Map<String, Object>> testDataEndpoint() {
        try {
            long totalStations = fuelStationRepository.count();
            List<FuelStation> allStations = fuelStationRepository.findAll();
            
            Map<String, Object> response = new HashMap<>();
            response.put("total", totalStations);
            response.put("stations", allStations.stream()
                    .map(station -> Map.of(
                        "id", station.getId(),
                        "name", station.getName(),
                        "address", station.getAddress(),
                        "status", station.getStatus()
                    ))
                    .collect(Collectors.toList()));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("type", e.getClass().getSimpleName());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Endpoint para verificar diretamente o banco
     */
    @GetMapping("/check-db")
    public ResponseEntity<Map<String, Object>> checkDatabase() {
        try {
            Map<String, Object> response = new HashMap<>();
            
            // Verificar se a tabela existe e tem dados
            long totalStations = fuelStationRepository.count();
            response.put("tableExists", true);
            response.put("totalRecords", totalStations);
            
            if (totalStations > 0) {
                List<FuelStation> sampleStations = fuelStationRepository.findAll().stream()
                        .limit(3)
                        .collect(Collectors.toList());
                
                response.put("sampleData", sampleStations.stream()
                        .map(station -> Map.of(
                            "id", station.getId(),
                            "name", station.getName(),
                            "address", station.getAddress()
                        ))
                        .collect(Collectors.toList()));
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("tableExists", false);
            error.put("error", e.getMessage());
            error.put("type", e.getClass().getSimpleName());
            return ResponseEntity.status(500).body(error);
        }
    }
}

