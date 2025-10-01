package br.com.fleetmanager.controller;

import br.com.fleetmanager.dto.VehicleDTO;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.Vehicle;
import lombok.RequiredArgsConstructor;
import br.com.fleetmanager.repository.VehicleRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/frota")
@RequiredArgsConstructor
public class FrotaController {
    
    private final VehicleRepository vehicleRepository;
    
    @GetMapping("/vehicles")
    public ResponseEntity<List<VehicleDTO>> getAllVehicles() {
        try {
            System.out.println("[DEBUG] FrotaController.getAllVehicles() - Iniciando busca...");
            
            // Testar conexão com o banco primeiro
            try {
                long count = vehicleRepository.count();
                System.out.println("[DEBUG] FrotaController.getAllVehicles() - Conexão com banco OK. Total de veículos: " + count);
            } catch (Exception dbError) {
                System.err.println("[DEBUG] FrotaController.getAllVehicles() - Erro na conexão com banco: " + dbError.getMessage());
                dbError.printStackTrace();
                return ResponseEntity.status(500).body(List.of());
            }
            
            List<Vehicle> vehicles = vehicleRepository.findAll();
            System.out.println("[DEBUG] FrotaController.getAllVehicles() - Veículos encontrados no banco: " + vehicles.size());
            
            if (vehicles.isEmpty()) {
                System.out.println("[DEBUG] FrotaController.getAllVehicles() - Lista vazia, retornando array vazio");
                return ResponseEntity.ok(List.of());
            }
            
            System.out.println("[DEBUG] FrotaController.getAllVehicles() - Primeiro veículo: " + vehicles.get(0).getPlate());
            
            List<VehicleDTO> vehicleDTOs = vehicles.stream()
                    .map(vehicle -> {
                        try {
                            System.out.println("[DEBUG] FrotaController.getAllVehicles() - Convertendo veículo: " + vehicle.getPlate());
                            VehicleDTO dto = VehicleDTO.fromEntity(vehicle);
                            System.out.println("[DEBUG] FrotaController.getAllVehicles() - DTO criado com sucesso para: " + vehicle.getPlate());
                            return dto;
                        } catch (Exception e) {
                            System.err.println("[DEBUG] FrotaController.getAllVehicles() - Erro ao converter veículo " + vehicle.getPlate() + ": " + e.getMessage());
                            System.err.println("[DEBUG] FrotaController.getAllVehicles() - Stack trace completo:");
                            e.printStackTrace();
                            throw e;
                        }
                    })
                    .collect(Collectors.toList());
            
            System.out.println("[DEBUG] FrotaController.getAllVehicles() - DTOs criados: " + vehicleDTOs.size());
            return ResponseEntity.ok(vehicleDTOs);
            
        } catch (Exception e) {
            System.err.println("[DEBUG] FrotaController.getAllVehicles() - Erro geral: " + e.getMessage());
            System.err.println("[DEBUG] FrotaController.getAllVehicles() - Tipo de erro: " + e.getClass().getSimpleName());
            System.err.println("[DEBUG] FrotaController.getAllVehicles() - Stack trace completo:");
            e.printStackTrace();
            return ResponseEntity.status(500).body(List.of());
        }
    }
    
    @GetMapping("/vehicles/{id}")
    public ResponseEntity<VehicleDTO> getVehicleById(@PathVariable UUID id) {
        try {
            Vehicle vehicle = vehicleRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado com ID: " + id));
            return ResponseEntity.ok(VehicleDTO.fromEntity(vehicle));
        } catch (Exception e) {
            System.err.println("[DEBUG] FrotaController.getVehicleById() - Erro: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    @GetMapping("/vehicles/plate/{plate}")
    public ResponseEntity<VehicleDTO> getVehicleByPlate(@PathVariable String plate) {
        try {
            Vehicle vehicle = vehicleRepository.findByPlate(plate)
                    .orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado com placa: " + plate));
            return ResponseEntity.ok(VehicleDTO.fromEntity(vehicle));
        } catch (Exception e) {
            System.err.println("[DEBUG] FrotaController.getVehicleByPlate() - Erro: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    @GetMapping("/vehicles/status/{status}")
    public ResponseEntity<List<VehicleDTO>> getVehiclesByStatus(@PathVariable Vehicle.VehicleStatus status) {
        try {
            List<Vehicle> vehicles = vehicleRepository.findByStatus(status);
            List<VehicleDTO> vehicleDTOs = vehicles.stream()
                    .map(VehicleDTO::fromEntity)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(vehicleDTOs);
        } catch (Exception e) {
            System.err.println("[DEBUG] FrotaController.getVehiclesByStatus() - Erro: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    @GetMapping("/vehicles/search")
    public ResponseEntity<List<VehicleDTO>> searchVehicles(@RequestParam String searchTerm) {
        try {
            List<Vehicle> vehicles = vehicleRepository.findBySearchTerm(searchTerm);
            List<VehicleDTO> vehicleDTOs = vehicles.stream()
                    .map(VehicleDTO::fromEntity)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(vehicleDTOs);
        } catch (Exception e) {
            System.err.println("[DEBUG] FrotaController.searchVehicles() - Erro: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    @PostMapping("/vehicles")
    public ResponseEntity<VehicleDTO> createVehicle(@Valid @RequestBody Vehicle vehicle) {
        try {
            if (vehicleRepository.existsByPlate(vehicle.getPlate())) {
                return ResponseEntity.badRequest().build();
            }
            Vehicle savedVehicle = vehicleRepository.save(vehicle);
            return ResponseEntity.ok(VehicleDTO.fromEntity(savedVehicle));
        } catch (Exception e) {
            System.err.println("[DEBUG] FrotaController.createVehicle() - Erro: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    @PutMapping("/vehicles/{id}")
    public ResponseEntity<VehicleDTO> updateVehicle(@PathVariable UUID id, @Valid @RequestBody Vehicle vehicleDetails) {
        try {
            Vehicle vehicle = vehicleRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado com ID: " + id));
            
            vehicle.setPlate(vehicleDetails.getPlate());
            vehicle.setModel(vehicleDetails.getModel());
            vehicle.setBrand(vehicleDetails.getBrand());
            vehicle.setYear(vehicleDetails.getYear());
            vehicle.setColor(vehicleDetails.getColor());
            vehicle.setStatus(vehicleDetails.getStatus());
            vehicle.setFuelType(vehicleDetails.getFuelType());
            vehicle.setCapacity(vehicleDetails.getCapacity());
            vehicle.setCurrentMileage(vehicleDetails.getCurrentMileage());
            vehicle.setLastMaintenanceDate(vehicleDetails.getLastMaintenanceDate());
            vehicle.setNextMaintenanceDate(vehicleDetails.getNextMaintenanceDate());
            vehicle.setInsuranceExpiryDate(vehicleDetails.getInsuranceExpiryDate());
            vehicle.setDocumentationExpiryDate(vehicleDetails.getDocumentationExpiryDate());
            
            Vehicle updatedVehicle = vehicleRepository.save(vehicle);
            return ResponseEntity.ok(VehicleDTO.fromEntity(updatedVehicle));
        } catch (Exception e) {
            System.err.println("[DEBUG] FrotaController.updateVehicle() - Erro: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    @DeleteMapping("/vehicles/{id}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable UUID id) {
        try {
            if (!vehicleRepository.existsById(id)) {
                throw new ResourceNotFoundException("Veículo não encontrado com ID: " + id);
            }
            vehicleRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            System.err.println("[DEBUG] FrotaController.deleteVehicle() - Erro: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    // Endpoints de teste
    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint() {
        return ResponseEntity.ok("Endpoint de teste da frota funcionando!");
    }
    
    @GetMapping("/test-simple")
    public ResponseEntity<Map<String, Object>> testSimple() {
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Teste simples funcionando");
            response.put("timestamp", LocalDateTime.now());
            response.put("status", "OK");
            
            // Testar acesso ao repositório
            try {
                long count = vehicleRepository.count();
                response.put("vehicleCount", count);
                response.put("database", "OK");
            } catch (Exception e) {
                response.put("database", "ERROR: " + e.getMessage());
                response.put("databaseErrorType", e.getClass().getSimpleName());
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("type", e.getClass().getSimpleName());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    @GetMapping("/test-db")
    public ResponseEntity<String> testDatabase() {
        try {
            long count = vehicleRepository.count();
            return ResponseEntity.ok("Conexão com banco OK. Total de veículos: " + count);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erro no banco: " + e.getMessage());
        }
    }
    
    @GetMapping("/insert-test-data")
    public ResponseEntity<String> insertTestData() {
        try {
            // Verificar se já existem dados
            long existingCount = vehicleRepository.count();
            if (existingCount > 0) {
                return ResponseEntity.ok("Dados de teste já existem. Total de veículos: " + existingCount);
            }
            
            // Inserir dados de teste diretamente
            System.out.println("[DEBUG] FrotaController.insertTestData() - Inserindo dados de teste...");
            
            // Aqui você pode inserir dados diretamente ou chamar um serviço
            // Por enquanto, vamos apenas retornar uma mensagem
            return ResponseEntity.ok("Endpoint para inserir dados de teste. Execute a migração V402 ou insira dados manualmente.");
            
        } catch (Exception e) {
            System.err.println("[DEBUG] FrotaController.insertTestData() - Erro: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erro ao inserir dados: " + e.getMessage());
        }
    }
    
    @GetMapping("/debug-vehicles")
    public ResponseEntity<String> debugVehicles() {
        try {
            StringBuilder debug = new StringBuilder();
            debug.append("=== DEBUG VEHICLES ===\n");
            
            // 1. Contar veículos
            long count = vehicleRepository.count();
            debug.append("1. Total de veículos no banco: ").append(count).append("\n");
            
            if (count == 0) {
                debug.append("2. Nenhum veículo encontrado\n");
                return ResponseEntity.ok(debug.toString());
            }
            
            // 2. Buscar primeiro veículo
            List<Vehicle> vehicles = vehicleRepository.findAll();
            debug.append("2. Veículos encontrados: ").append(vehicles.size()).append("\n");
            
            if (!vehicles.isEmpty()) {
                Vehicle firstVehicle = vehicles.get(0);
                debug.append("3. Primeiro veículo:\n");
                debug.append("   - ID: ").append(firstVehicle.getId()).append("\n");
                debug.append("   - Placa: ").append(firstVehicle.getPlate()).append("\n");
                debug.append("   - Modelo: ").append(firstVehicle.getModel()).append("\n");
                debug.append("   - Marca: ").append(firstVehicle.getBrand()).append("\n");
                debug.append("   - Ano: ").append(firstVehicle.getYear()).append("\n");
                debug.append("   - Status: ").append(firstVehicle.getStatus()).append("\n");
                debug.append("   - Tipo Combustível: ").append(firstVehicle.getFuelType()).append("\n");
                debug.append("   - Capacidade: ").append(firstVehicle.getCapacity()).append("\n");
                debug.append("   - Quilometragem: ").append(firstVehicle.getCurrentMileage()).append("\n");
                debug.append("   - Criado em: ").append(firstVehicle.getCreatedAt()).append("\n");
                debug.append("   - Atualizado em: ").append(firstVehicle.getUpdatedAt()).append("\n");
                
                // 3. Tentar converter para DTO
                try {
                    debug.append("4. Tentando converter para DTO...\n");
                    VehicleDTO dto = VehicleDTO.fromEntity(firstVehicle);
                    debug.append("5. Conversão para DTO: SUCESSO\n");
                    debug.append("   - DTO ID: ").append(dto.getId()).append("\n");
                    debug.append("   - DTO Placa: ").append(dto.getPlate()).append("\n");
                } catch (Exception e) {
                    debug.append("5. Conversão para DTO: ERRO\n");
                    debug.append("   - Erro: ").append(e.getMessage()).append("\n");
                    debug.append("   - Tipo: ").append(e.getClass().getSimpleName()).append("\n");
                    e.printStackTrace();
                }
            }
            
            return ResponseEntity.ok(debug.toString());
            
        } catch (Exception e) {
            System.err.println("[DEBUG] FrotaController.debugVehicles() - Erro: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erro no debug: " + e.getMessage());
        }
    }
}
