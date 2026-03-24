package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.VehicleGateChecklistDTO;
import com.z7design.fleet_manager.model.VehicleGateChecklist;
import com.z7design.fleet_manager.service.VehicleGateChecklistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/frota/vehicle-gate-checklists")
@RequiredArgsConstructor
@Slf4j
public class VehicleGateChecklistController {

    private final VehicleGateChecklistService service;

    @GetMapping
    public ResponseEntity<List<VehicleGateChecklistDTO>> findAll(
            @RequestParam(required = false) UUID vehicleId,
            @RequestParam(required = false) VehicleGateChecklist.ChecklistType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        if (vehicleId != null || type != null || dateFrom != null || dateTo != null) {
            return ResponseEntity.ok(service.findByFilters(vehicleId, type, dateFrom, dateTo));
        }
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleGateChecklistDTO> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<VehicleGateChecklistDTO> create(@Valid @RequestBody VehicleGateChecklistDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VehicleGateChecklistDTO> update(
            @PathVariable UUID id,
            @Valid @RequestBody VehicleGateChecklistDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/odometer-photo")
    public ResponseEntity<VehicleGateChecklistDTO> uploadOdometerPhoto(
            @PathVariable UUID id,
            @RequestParam("photo") MultipartFile file,
            @RequestParam(value = "description", required = false) String description) {
        return ResponseEntity.ok(service.uploadOdometerPhoto(id, file, description));
    }

    @PostMapping("/{id}/vehicle-photos")
    public ResponseEntity<VehicleGateChecklistDTO> uploadVehiclePhotos(
            @PathVariable UUID id,
            @RequestParam(value = "photos", required = false) MultipartFile[] files) {
        MultipartFile[] safeFiles = (files != null) ? files : new MultipartFile[0];
        return ResponseEntity.ok(service.uploadVehiclePhotos(id, safeFiles));
    }
}
