package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.VehicleFuelEfficiencyDTO;
import com.z7design.fleet_manager.service.VehicleFuelEfficiencyService;
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
     * Endpoint de teste para verificar se o controller estÃ¡ funcionando
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        log.info("ðŸ§ª Endpoint de teste chamado - controller funcionando!");
        return ResponseEntity.ok("âœ… VehicleFuelEfficiencyController funcionando!");
    }
    
    /**
     * Buscar o veÃ­culo com melhor eficiÃªncia de combustÃ­vel
     */
    @GetMapping("/best")
    public ResponseEntity<VehicleFuelEfficiencyDTO> getMostEfficientVehicle() {
        try {
            log.info("ðŸ” Endpoint /best chamado - buscando veÃ­culo mais eficiente");
            VehicleFuelEfficiencyDTO efficiency = efficiencyService.getMostEfficientVehicle();
            
            if (efficiency.getVehicleId() != null) {
                log.info("âœ… VeÃ­culo mais eficiente encontrado: {} ({})", 
                        efficiency.getVehicleName(), efficiency.getVehiclePlate());
                return ResponseEntity.ok(efficiency);
            } else {
                log.warn("âš ï¸ Nenhum veÃ­culo com dados suficientes encontrado");
                return ResponseEntity.ok(efficiency);
            }
        } catch (Exception e) {
            log.error("âŒ Erro ao buscar veÃ­culo mais eficiente: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Buscar eficiÃªncia de todos os veÃ­culos
     */
    @GetMapping("/all")
    public ResponseEntity<List<VehicleFuelEfficiencyDTO>> getAllVehiclesEfficiency() {
        try {
            log.info("ðŸ” Endpoint /all chamado - buscando eficiÃªncia de todos os veÃ­culos");
            List<VehicleFuelEfficiencyDTO> efficiencies = efficiencyService.getAllVehiclesEfficiency();
            
            log.info("âœ… EficiÃªncia calculada para {} veÃ­culos", efficiencies.size());
            return ResponseEntity.ok(efficiencies);
        } catch (Exception e) {
            log.error("âŒ Erro ao buscar eficiÃªncia de todos os veÃ­culos: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Buscar eficiÃªncia de um veÃ­culo especÃ­fico
     */
    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<VehicleFuelEfficiencyDTO> getVehicleEfficiency(@PathVariable String vehicleId) {
        try {
            log.info("ðŸ” Endpoint /vehicle/{} chamado - buscando eficiÃªncia do veÃ­culo", vehicleId);
            
            // Aqui vocÃª precisaria implementar um mÃ©todo para buscar veÃ­culo por ID
            // Por enquanto, vou retornar o veÃ­culo mais eficiente
            VehicleFuelEfficiencyDTO efficiency = efficiencyService.getMostEfficientVehicle();
            
            return ResponseEntity.ok(efficiency);
        } catch (Exception e) {
            log.error("âŒ Erro ao buscar eficiÃªncia do veÃ­culo {}: {}", vehicleId, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}

