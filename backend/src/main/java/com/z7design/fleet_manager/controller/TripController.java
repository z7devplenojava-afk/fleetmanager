package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.TripFinishRequestDTO;
import com.z7design.fleet_manager.dto.TripOperacionalDTO;
import com.z7design.fleet_manager.model.Trip;
import com.z7design.fleet_manager.service.TripService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {

    private static final String READ_AUTH =
            "hasAnyAuthority('TRAFFIC_MANAGEMENT_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', "
                    + "'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')";
    private static final String WRITE_AUTH =
            "hasAnyAuthority('TRAFFIC_MANAGEMENT_WRITE', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', "
                    + "'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')";

    private final TripService tripService;

    @PostMapping("/start/{scheduleId}")
    @PreAuthorize("hasAnyAuthority('TRIPS_EXECUTE', 'TRAFFIC_MANAGEMENT_WRITE', 'ROLE_MANAGER_TRAFEGO', "
            + "'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<Trip> startTrip(@PathVariable("scheduleId") UUID scheduleId) {
        return ResponseEntity.ok(tripService.startTrip(scheduleId));
    }

    @GetMapping("/events")
    @PreAuthorize("hasAnyAuthority('TRIPS_READ', 'TRAFFIC_MANAGEMENT_READ', 'ROLE_MANAGER_TRAFEGO', "
            + "'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<?> getEvents() {
        return ResponseEntity.ok(tripService.getEvents());
    }

    // ---------------------------------------------------------------
    // Ciclo de vida operacional (PRD VSS - Fase 3)
    // ---------------------------------------------------------------

    @GetMapping
    @PreAuthorize(READ_AUTH)
    public ResponseEntity<List<TripOperacionalDTO>> getAll(
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(value = "routeId", required = false) UUID routeId) {
        return ResponseEntity.ok(tripService.findAll(date, routeId));
    }

    @GetMapping("/{id}")
    @PreAuthorize(READ_AUTH)
    public ResponseEntity<TripOperacionalDTO> getById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(tripService.findById(id));
    }

    /** Cria a viagem a partir de uma escala operacional. */
    @PostMapping("/{scaleId}")
    @PreAuthorize(WRITE_AUTH)
    public ResponseEntity<TripOperacionalDTO> createFromScale(@PathVariable("scaleId") UUID scaleId) {
        return ResponseEntity.ok(tripService.createFromScale(scaleId));
    }

    @PostMapping("/{id}/confirm-driver")
    @PreAuthorize(WRITE_AUTH)
    public ResponseEntity<TripOperacionalDTO> confirmDriver(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(tripService.confirmDriver(id));
    }

    @PostMapping("/{id}/confirm-vehicle")
    @PreAuthorize(WRITE_AUTH)
    public ResponseEntity<TripOperacionalDTO> confirmVehicle(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(tripService.confirmVehicle(id));
    }

    @PostMapping("/{id}/start")
    @PreAuthorize(WRITE_AUTH)
    public ResponseEntity<TripOperacionalDTO> start(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(tripService.start(id));
    }

    @PostMapping("/{id}/arrive")
    @PreAuthorize(WRITE_AUTH)
    public ResponseEntity<TripOperacionalDTO> arrive(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(tripService.arrive(id));
    }

    /** Finaliza a viagem (km final + passageiros + ocorrencia) e gera DailyLog + Parte Diaria. */
    @PostMapping("/{id}/finish")
    @PreAuthorize(WRITE_AUTH)
    public ResponseEntity<TripOperacionalDTO> finish(@PathVariable("id") UUID id,
                                                     @RequestBody TripFinishRequestDTO request) {
        return ResponseEntity.ok(tripService.finish(id, request));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize(WRITE_AUTH)
    public ResponseEntity<TripOperacionalDTO> cancel(@PathVariable("id") UUID id,
                                                     @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(tripService.cancel(id, reason));
    }
}
