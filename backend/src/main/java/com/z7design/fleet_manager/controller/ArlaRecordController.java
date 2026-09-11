package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.ArlaRecordDTO;
import com.z7design.fleet_manager.service.ArlaRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/arla-records")
@RequiredArgsConstructor
public class ArlaRecordController {

    private final ArlaRecordService service;

    @GetMapping
    public ResponseEntity<List<ArlaRecordDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<List<ArlaRecordDTO>> getByVehicle(@PathVariable("vehicleId") UUID vehicleId) {
        return ResponseEntity.ok(service.getByVehicle(vehicleId));
    }

    @PostMapping
    public ResponseEntity<ArlaRecordDTO> create(@RequestBody ArlaRecordDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
