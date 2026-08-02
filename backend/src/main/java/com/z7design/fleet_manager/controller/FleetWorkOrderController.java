package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.FleetWorkOrderDTO;
import com.z7design.fleet_manager.dto.FleetWorkOrderHistoryDTO;
import com.z7design.fleet_manager.dto.VehicleMaintenanceRankingDTO;
import com.z7design.fleet_manager.model.FleetWorkOrder;
import com.z7design.fleet_manager.service.FleetWorkOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/fleet-work-orders")
@RequiredArgsConstructor
public class FleetWorkOrderController {

    private final FleetWorkOrderService service;

    /** Lista todas as OSs */
    @GetMapping
    public ResponseEntity<List<FleetWorkOrderDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    /** Busca uma OS pelo ID */
    @GetMapping("/{id}")
    public ResponseEntity<FleetWorkOrderDTO> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    /** Cria nova OS */
    @PostMapping
    public ResponseEntity<FleetWorkOrderDTO> create(@RequestBody FleetWorkOrderDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    /** Atualização completa de uma OS (todos os campos editáveis) */
    @PutMapping("/{id}")
    public ResponseEntity<FleetWorkOrderDTO> update(
            @PathVariable UUID id,
            @RequestBody FleetWorkOrderDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    /** Atualiza somente o status (workflow) — PATCH */
    @PatchMapping("/{id}/status")
    public ResponseEntity<FleetWorkOrderDTO> updateStatus(
            @PathVariable UUID id,
            @RequestParam FleetWorkOrder.WorkOrderStatus status) {
        return ResponseEntity.ok(service.updateStatus(id, status));
    }

    /** Compatibilidade — PUT para mudança de status */
    @PutMapping("/{id}/status")
    public ResponseEntity<FleetWorkOrderDTO> updateStatusPut(
            @PathVariable UUID id,
            @RequestParam FleetWorkOrder.WorkOrderStatus status) {
        return ResponseEntity.ok(service.updateStatus(id, status));
    }

    /** Exclui uma OS */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ── Histórico ────────────────────────────────────────────────────────────

    /** Retorna a timeline/histórico completo de uma OS */
    @GetMapping("/{id}/history")
    public ResponseEntity<List<FleetWorkOrderHistoryDTO>> getHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getHistory(id));
    }

    /** Adiciona uma nota manual à timeline da OS */
    @PostMapping("/{id}/history/note")
    public ResponseEntity<FleetWorkOrderHistoryDTO> addNote(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String note        = body.getOrDefault("note", "");
        String performedBy = body.getOrDefault("performedBy", "Usuário");
        return ResponseEntity.ok(service.addNote(id, note, performedBy));
    }

    // ── Ranking ───────────────────────────────────────────────────────────────

    /** Ranking de veículos por quantidade de manutenções e custo acumulado */
    @GetMapping("/ranking/vehicles")
    public ResponseEntity<List<VehicleMaintenanceRankingDTO>> getVehicleRanking() {
        return ResponseEntity.ok(service.getVehicleRanking());
    }
}
