package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.FleetWorkOrderDTO;
import com.z7design.fleet_manager.model.FleetWorkOrder;
import com.z7design.fleet_manager.service.FleetWorkOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/fleet-work-orders")
@RequiredArgsConstructor
public class FleetWorkOrderController {

    private final FleetWorkOrderService service;

    @GetMapping
    public ResponseEntity<List<FleetWorkOrderDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FleetWorkOrderDTO> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<FleetWorkOrderDTO> create(@RequestBody FleetWorkOrderDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<FleetWorkOrderDTO> updateStatus(
            @PathVariable UUID id,
            @RequestParam FleetWorkOrder.WorkOrderStatus status) {
        return ResponseEntity.ok(service.updateStatus(id, status));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<FleetWorkOrderDTO> updateStatusPut(
            @PathVariable UUID id,
            @RequestParam FleetWorkOrder.WorkOrderStatus status) {
        return ResponseEntity.ok(service.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
