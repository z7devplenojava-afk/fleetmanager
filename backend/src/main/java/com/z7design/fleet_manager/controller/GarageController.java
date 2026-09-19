package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.GarageDTO;
import com.z7design.fleet_manager.dto.GarageMovementDTO;
import com.z7design.fleet_manager.dto.GarageOccupancyDashboardDTO;
import com.z7design.fleet_manager.dto.GarageTransferRequest;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.GarageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Endpoints de Gestão de Garagens:
 * <ul>
 *   <li>CRUD de garagens com responsável;</li>
 *   <li>Veículos alocados por garagem (quantos e quais);</li>
 *   <li>Alocação/desalocação de veículos;</li>
 *   <li>Garagem do veículo (usada por OS, mobilização e limpeza).</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/garages")
@RequiredArgsConstructor
@Slf4j
public class GarageController {

    private final GarageService service;

    @GetMapping
    public ResponseEntity<List<GarageDTO>> list(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.list(user.getCompanyId()));
    }

    /** Dashboard de ocupação com alertas de lotação (>= 90% atenção, 100% lotada). */
    @GetMapping("/dashboard")
    public ResponseEntity<GarageOccupancyDashboardDTO> occupancyDashboard(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.getOccupancyDashboard(user.getCompanyId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GarageDTO> getById(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.getById(id, user.getCompanyId()));
    }

    @PostMapping
    public ResponseEntity<GarageDTO> create(
            @RequestBody GarageDTO dto,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.create(dto, user.getCompanyId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GarageDTO> update(
            @PathVariable("id") UUID id,
            @RequestBody GarageDTO dto,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.update(id, dto, user.getCompanyId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal User user) {
        service.delete(id, user.getCompanyId());
        return ResponseEntity.noContent().build();
    }

    /** Quantos e quais veículos estão na garagem. */
    @GetMapping("/{id}/vehicles")
    public ResponseEntity<GarageDTO> getVehicles(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.getById(id, user.getCompanyId()));
    }

    /** Aloca um veículo na garagem. */
    @PostMapping("/{id}/vehicles/{vehicleId}")
    public ResponseEntity<GarageDTO> assignVehicle(
            @PathVariable("id") UUID id,
            @PathVariable("vehicleId") UUID vehicleId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.assignVehicle(id, vehicleId, user.getCompanyId()));
    }

    /** Remove o veículo da garagem. */
    @DeleteMapping("/{id}/vehicles/{vehicleId}")
    public ResponseEntity<GarageDTO> unassignVehicle(
            @PathVariable("id") UUID id,
            @PathVariable("vehicleId") UUID vehicleId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.unassignVehicle(id, vehicleId, user.getCompanyId()));
    }

    /** Garagem atual do veículo (fallback cria a garagem pelo garageName). */
    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<GarageDTO> getVehicleGarage(
            @PathVariable("vehicleId") UUID vehicleId) {
        return ResponseEntity.ok(service.resolveVehicleGarage(vehicleId));
    }

    /** Remanejamento de veículo entre garagens com registro no histórico. */
    @PostMapping("/transfers")
    public ResponseEntity<GarageMovementDTO> transferVehicle(
            @Valid @RequestBody GarageTransferRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.transferVehicle(request, user.getCompanyId(), user));
    }

    /** Histórico de movimentações entre garagens (paginado). */
    @GetMapping("/movements")
    public ResponseEntity<List<GarageMovementDTO>> listMovements(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "30") int size,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.listMovements(user.getCompanyId(), page, size));
    }

    /** Histórico de movimentações de um veículo. */
    @GetMapping("/movements/vehicle/{vehicleId}")
    public ResponseEntity<List<GarageMovementDTO>> getVehicleMovements(
            @PathVariable("vehicleId") UUID vehicleId) {
        return ResponseEntity.ok(service.getVehicleMovements(vehicleId));
    }

    /** Check-in rápido de entrada no pátio (Portaria / QR Code). */
    @PostMapping("/check-in")
    public ResponseEntity<GarageMovementDTO> checkIn(
            @Valid @RequestBody com.z7design.fleet_manager.dto.GarageCheckInRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.checkInVehicle(request, user.getCompanyId(), user));
    }

    /** Check-out rápido de saída do pátio (Portaria / QR Code). */
    @PostMapping("/check-out")
    public ResponseEntity<GarageMovementDTO> checkOut(
            @Valid @RequestBody com.z7design.fleet_manager.dto.GarageCheckOutRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.checkOutVehicle(request, user.getCompanyId(), user));
    }

    /** Veículos atualmente dentro das garagens com tempo de permanência live. */
    @GetMapping("/active-stays")
    public ResponseEntity<List<GarageMovementDTO>> listActiveStays(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.listActiveStays(user.getCompanyId()));
    }

    /** Endpoint para execução do seed de garagens e alocação de veículos de demonstração. */
    @PostMapping("/seed")
    public ResponseEntity<String> seed(@AuthenticationPrincipal User user) {
        service.seedGaragesAndVehicles(user.getCompanyId());
        return ResponseEntity.ok("Seed de garagens executado com sucesso");
    }

    /** Últimas chegadas em uma garagem. */
    @GetMapping("/{id}/arrivals")
    public ResponseEntity<List<GarageMovementDTO>> getArrivals(
            @PathVariable("id") UUID id,
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        return ResponseEntity.ok(service.getGarageArrivals(id, limit));
    }
}
