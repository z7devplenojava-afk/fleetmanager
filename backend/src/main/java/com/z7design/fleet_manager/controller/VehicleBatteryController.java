package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.VehicleBatteryDTO;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.VehicleBattery;
import com.z7design.fleet_manager.service.VehicleBatteryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/frota/vehicle-batteries")
@RequiredArgsConstructor
public class VehicleBatteryController {

    private final VehicleBatteryService service;

    @GetMapping
    public ResponseEntity<List<VehicleBatteryDTO>> list(
            @RequestParam(required = false) UUID vehicleId,
            @RequestParam(required = false) VehicleBattery.BatteryStatus status,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.list(vehicleId, status, user.getCompanyId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleBatteryDTO> getById(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.getById(id, user.getCompanyId()));
    }

    @PostMapping
    public ResponseEntity<VehicleBatteryDTO> create(
            @RequestBody VehicleBatteryDTO dto,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.create(dto, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VehicleBatteryDTO> update(
            @PathVariable UUID id,
            @RequestBody VehicleBatteryDTO dto,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.update(id, dto, user.getCompanyId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        service.delete(id, user.getCompanyId());
        return ResponseEntity.noContent().build();
    }
}
