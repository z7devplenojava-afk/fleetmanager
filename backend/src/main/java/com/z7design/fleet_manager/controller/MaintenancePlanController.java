package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.MaintenancePlanDTO;
import com.z7design.fleet_manager.dto.VehicleMaintenanceAlertDTO;
import com.z7design.fleet_manager.dto.VehicleMaintenanceStatusDTO;
import com.z7design.fleet_manager.service.MaintenancePlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/maintenance-plans")
@RequiredArgsConstructor
public class MaintenancePlanController {

    private final MaintenancePlanService service;

    @GetMapping
    public ResponseEntity<List<MaintenancePlanDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<List<MaintenancePlanDTO>> getByVehicle(@PathVariable("vehicleId") UUID vehicleId) {
        return ResponseEntity.ok(service.getByVehicle(vehicleId));
    }

    /**
     * Status de próxima manutenção do veículo: para cada plano ativo calcula
     * kmRemaining, daysRemaining e nível de alerta (OK / UPCOMING / OVERDUE /
     * NO_SCHEDULE), consolidando o alerta mais crítico do veículo.
     */
    @GetMapping("/vehicle/{vehicleId}/status")
    public ResponseEntity<VehicleMaintenanceStatusDTO> getVehicleMaintenanceStatus(
            @PathVariable("vehicleId") UUID vehicleId) {
        return ResponseEntity.ok(service.getVehicleMaintenanceStatus(vehicleId));
    }

    /**
     * Alerta consolidado de manutenção para todos os veículos — usado para
     * exibir badges de alerta nas listagens sem N consultas.
     */
    @GetMapping("/status/all")
    public ResponseEntity<List<VehicleMaintenanceAlertDTO>> getAllVehiclesMaintenanceAlerts() {
        return ResponseEntity.ok(service.getAllVehiclesMaintenanceAlerts());
    }

    @PostMapping
    public ResponseEntity<MaintenancePlanDTO> createOrUpdate(@RequestBody MaintenancePlanDTO dto) {
        return ResponseEntity.ok(service.createOrUpdate(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
