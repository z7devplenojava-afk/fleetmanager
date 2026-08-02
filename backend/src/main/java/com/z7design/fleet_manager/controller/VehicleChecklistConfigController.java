package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.VehicleChecklistConfigCopyRequest;
import com.z7design.fleet_manager.dto.VehicleChecklistConfigCopyResponse;
import com.z7design.fleet_manager.dto.VehicleChecklistConfigDTO;
import com.z7design.fleet_manager.service.VehicleChecklistConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/frota/checklist-configs")
@RequiredArgsConstructor
@Slf4j
public class VehicleChecklistConfigController {

    private final VehicleChecklistConfigService service;

    /**
     * Retorna os itens efetivos do checklist para um veículo.
     * Sem vehicleId, retorna o template padrão global.
     */
    @GetMapping
    public ResponseEntity<List<VehicleChecklistConfigDTO>> getForVehicle(
            @RequestParam(name = "vehicleId", required = false) UUID vehicleId) {
        return ResponseEntity.ok(service.getForVehicle(vehicleId));
    }

    /**
     * Retorna o template padrão global (itens aplicados a veículos sem configuração própria).
     */
    @GetMapping("/default")
    public ResponseEntity<List<VehicleChecklistConfigDTO>> getDefaultTemplate() {
        return ResponseEntity.ok(service.getDefaultTemplate());
    }

    /**
     * Substitui os itens do checklist de um veículo (ou do template padrão global quando
     * vehicleId é nulo) pela lista informada.
     */
    @PutMapping
    public ResponseEntity<List<VehicleChecklistConfigDTO>> replace(
            @RequestParam(name = "vehicleId", required = false) UUID vehicleId,
            @RequestBody List<VehicleChecklistConfigDTO> items) {
        return ResponseEntity.ok(service.replace(vehicleId, items));
    }

    /**
     * Copia a configuração informada para vários veículos em uma única requisição,
     * substituindo a configuração existente de cada destino.
     */
    @PostMapping("/copy")
    public ResponseEntity<VehicleChecklistConfigCopyResponse> copy(
            @RequestBody VehicleChecklistConfigCopyRequest request) {
        return ResponseEntity.ok(service.copy(request));
    }
}
