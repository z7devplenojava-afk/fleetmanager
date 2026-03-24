package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.MaintenancePlanDTO;
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
    public ResponseEntity<List<MaintenancePlanDTO>> getByVehicle(@PathVariable UUID vehicleId) {
        return ResponseEntity.ok(service.getByVehicle(vehicleId));
    }

    @PostMapping
    public ResponseEntity<MaintenancePlanDTO> createOrUpdate(@RequestBody MaintenancePlanDTO dto) {
        return ResponseEntity.ok(service.createOrUpdate(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
