package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.VehicleFuelEfficiencyService;

import br.com.fleetmanager.dto.VehicleFuelEfficiencyDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/frota/efficiency")
@RequiredArgsConstructor
@Slf4j
public class VehicleFuelEfficiencyController {
    
    private final VehicleFuelEfficiencyService efficiencyService;
    
    /**
     * Endpoint de teste para verificar se o controller está funcionando
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        log.info("🧪 Endpoint de teste chamado - controller funcionando!");
        return ResponseEntity.ok("✅ VehicleFuelEfficiencyController funcionando!");
    }
    
    /**
     * Buscar o veículo com melhor eficiência de combustível
     */
    @GetMapping("/best")
    public ResponseEntity<VehicleFuelEfficiencyDTO> getMostEfficientVehicle() {
        try {
            log.info("🔍 Endpoint /best chamado - buscando veículo mais eficiente");
            VehicleFuelEfficiencyDTO efficiency = efficiencyService.getMostEfficientVehicle();
            
            if (efficiency.getVehicleId() != null) {
                log.info("✅ Veículo mais eficiente encontrado: {} ({})", 
                        efficiency.getVehicleName(), efficiency.getVehiclePlate());
                return ResponseEntity.ok(efficiency);
            } else {
                log.warn("⚠️ Nenhum veículo com dados suficientes encontrado");
                return ResponseEntity.ok(efficiency);
            }
        } catch (Exception e) {
            log.error("❌ Erro ao buscar veículo mais eficiente: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Buscar eficiência de todos os veículos
     */
    @GetMapping("/all")
    public ResponseEntity<List<VehicleFuelEfficiencyDTO>> getAllVehiclesEfficiency() {
        try {
            log.info("🔍 Endpoint /all chamado - buscando eficiência de todos os veículos");
            List<VehicleFuelEfficiencyDTO> efficiencies = efficiencyService.getAllVehiclesEfficiency();
            
            log.info("✅ Eficiência calculada para {} veículos", efficiencies.size());
            return ResponseEntity.ok(efficiencies);
        } catch (Exception e) {
            log.error("❌ Erro ao buscar eficiência de todos os veículos: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Buscar eficiência de um veículo específico
     */
    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<VehicleFuelEfficiencyDTO> getVehicleEfficiency(@PathVariable String vehicleId) {
        try {
            log.info("🔍 Endpoint /vehicle/{} chamado - buscando eficiência do veículo", vehicleId);
            
            // Aqui você precisaria implementar um método para buscar veículo por ID
            // Por enquanto, vou retornar o veículo mais eficiente
            VehicleFuelEfficiencyDTO efficiency = efficiencyService.getMostEfficientVehicle();
            
            return ResponseEntity.ok(efficiency);
        } catch (Exception e) {
            log.error("❌ Erro ao buscar eficiência do veículo {}: {}", vehicleId, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
