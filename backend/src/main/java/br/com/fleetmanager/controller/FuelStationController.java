package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.FuelStationService;

import br.com.fleetmanager.dto.CreateFuelStationDTO;
import br.com.fleetmanager.dto.FuelStationDTO;
import br.com.fleetmanager.model.FuelStation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import br.com.fleetmanager.repository.FuelStationRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/fuel-stations")
@RequiredArgsConstructor
@Slf4j
public class FuelStationController {
    
    private final FuelStationService fuelStationService;
    private final FuelStationRepository fuelStationRepository;
    
    /**
     * Buscar todos os postos de combustível
     */
    @GetMapping
    public ResponseEntity<List<FuelStationDTO>> getAllFuelStations() {
        log.info("🔍 GET /api/fuel-stations - Buscando todos os postos");
        List<FuelStationDTO> stations = fuelStationService.getAllFuelStations();
        log.info("✅ Retornando {} postos de combustível", stations.size());
        return ResponseEntity.ok(stations);
    }
    
    /**
     * Buscar posto por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<FuelStationDTO> getFuelStationById(@PathVariable UUID id) {
        log.info("🔍 GET /api/fuel-stations/{} - Buscando posto por ID", id);
        FuelStationDTO station = fuelStationService.getFuelStationById(id);
        log.info("✅ Posto encontrado: {}", station.getName());
        return ResponseEntity.ok(station);
    }
    
    /**
     * Buscar posto por nome
     */
    @GetMapping("/name/{name}")
    public ResponseEntity<FuelStationDTO> getFuelStationByName(@PathVariable String name) {
        log.info("🔍 GET /api/fuel-stations/name/{} - Buscando posto por nome", name);
        FuelStationDTO station = fuelStationService.getFuelStationByName(name);
        log.info("✅ Posto encontrado: {}", station.getName());
        return ResponseEntity.ok(station);
    }
    
    /**
     * Buscar postos por cidade
     */
    @GetMapping("/city/{city}")
    public ResponseEntity<List<FuelStationDTO>> getFuelStationsByCity(@PathVariable String city) {
        log.info("🔍 GET /api/fuel-stations/city/{} - Buscando postos por cidade", city);
        List<FuelStationDTO> stations = fuelStationService.getFuelStationsByCity(city);
        log.info("✅ Encontrados {} postos na cidade {}", stations.size(), city);
        return ResponseEntity.ok(stations);
    }
    
    /**
     * Buscar postos por marca/bandeira
     */
    @GetMapping("/brand/{brand}")
    public ResponseEntity<List<FuelStationDTO>> getFuelStationsByBrand(@PathVariable String brand) {
        log.info("🔍 GET /api/fuel-stations/brand/{} - Buscando postos por marca", brand);
        List<FuelStationDTO> stations = fuelStationService.getFuelStationsByBrand(brand);
        log.info("✅ Encontrados {} postos da marca {}", stations.size(), brand);
        return ResponseEntity.ok(stations);
    }
    
    /**
     * Buscar postos ativos
     */
    @GetMapping("/active")
    public ResponseEntity<List<FuelStationDTO>> getActiveFuelStations() {
        log.info("🔍 GET /api/fuel-stations/active - Buscando postos ativos");
        List<FuelStationDTO> stations = fuelStationService.getActiveFuelStations();
        log.info("✅ Encontrados {} postos ativos", stations.size());
        return ResponseEntity.ok(stations);
    }
    
    /**
     * Buscar postos próximos por coordenadas
     */
    @GetMapping("/nearby")
    public ResponseEntity<List<FuelStationDTO>> getNearbyFuelStations(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "10.0") Double radius) {
        log.info("🔍 GET /api/fuel-stations/nearby - Buscando postos próximos às coordenadas ({}, {}) com raio {} km", 
                latitude, longitude, radius);
        List<FuelStationDTO> stations = fuelStationService.getNearbyFuelStations(latitude, longitude, radius);
        log.info("✅ Encontrados {} postos próximos", stations.size());
        return ResponseEntity.ok(stations);
    }
    
    /**
     * Obter estatísticas dos postos
     */
    @GetMapping("/stats")
    public ResponseEntity<Object> getFuelStationStats() {
        log.info("🔍 GET /api/fuel-stations/stats - Buscando estatísticas dos postos");
        Object stats = fuelStationService.getFuelStationStats();
        log.info("✅ Estatísticas retornadas: {}", stats);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Criar novo posto de combustível
     */
    @PostMapping
    public ResponseEntity<FuelStationDTO> createFuelStation(@Valid @RequestBody CreateFuelStationDTO dto) {
        log.info("🔍 POST /api/fuel-stations - Criando novo posto: {}", dto.getName());
        FuelStationDTO createdStation = fuelStationService.createFuelStation(dto);
        log.info("✅ Posto criado com sucesso: {} (ID: {})", createdStation.getName(), createdStation.getId());
        return ResponseEntity.ok(createdStation);
    }
    
    /**
     * Atualizar posto de combustível
     */
    @PutMapping("/{id}")
    public ResponseEntity<FuelStationDTO> updateFuelStation(
            @PathVariable UUID id, 
            @Valid @RequestBody CreateFuelStationDTO dto) {
        log.info("🔍 PUT /api/fuel-stations/{} - Atualizando posto", id);
        FuelStationDTO updatedStation = fuelStationService.updateFuelStation(id, dto);
        log.info("✅ Posto atualizado com sucesso: {} (ID: {})", updatedStation.getName(), updatedStation.getId());
        return ResponseEntity.ok(updatedStation);
    }
    
    /**
     * Alterar status do posto
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<FuelStationDTO> updateFuelStationStatus(
            @PathVariable UUID id, 
            @RequestParam FuelStation.FuelStationStatus status) {
        log.info("🔍 PATCH /api/fuel-stations/{}/status - Alterando status para: {}", id, status);
        FuelStationDTO updatedStation = fuelStationService.updateFuelStationStatus(id, status);
        log.info("✅ Status do posto {} alterado para: {}", updatedStation.getName(), status);
        return ResponseEntity.ok(updatedStation);
    }
    
    /**
     * Excluir posto de combustível
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFuelStation(@PathVariable UUID id) {
        log.info("🔍 DELETE /api/fuel-stations/{} - Excluindo posto", id);
        fuelStationService.deleteFuelStation(id);
        log.info("✅ Posto excluído com sucesso (ID: {})", id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Endpoint de teste
     */
    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint() {
        return ResponseEntity.ok("Endpoint de postos de combustível funcionando!");
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
