package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.CarWashDTO;
import com.z7design.fleet_manager.service.CarWashService;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/car-washes", "/api/v1/car-washes"})
@RequiredArgsConstructor
public class CarWashController {

    private final CarWashService service;

    @GetMapping
    public ResponseEntity<List<CarWashDTO>> list() {
        UUID companyId = TenantContext.get();
        return ResponseEntity.ok(service.list(companyId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CarWashDTO> getById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<CarWashDTO> create(@RequestBody CarWashDTO dto) {
        UUID companyId = TenantContext.get();
        return ResponseEntity.ok(service.create(dto, companyId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CarWashDTO> update(
            @PathVariable("id") UUID id,
            @RequestBody CarWashDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
