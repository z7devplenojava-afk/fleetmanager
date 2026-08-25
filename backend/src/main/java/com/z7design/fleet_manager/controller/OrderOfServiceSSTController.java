package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.OrderOfServiceSSTRequestDTO;
import com.z7design.fleet_manager.dto.OrderOfServiceSSTResponseDTO;
import com.z7design.fleet_manager.service.OrderOfServiceSSTService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders-of-service-sst")
@RequiredArgsConstructor
public class OrderOfServiceSSTController {
    private final OrderOfServiceSSTService service;

    @PostMapping
    public ResponseEntity<OrderOfServiceSSTResponseDTO> create(@RequestBody OrderOfServiceSSTRequestDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrderOfServiceSSTResponseDTO> update(@PathVariable("id") UUID id, @RequestBody OrderOfServiceSSTRequestDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderOfServiceSSTResponseDTO> findById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping
    public ResponseEntity<List<OrderOfServiceSSTResponseDTO>> findAll() {
        return ResponseEntity.ok(service.findAll());
    }
} 
