package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.DriverShift;
import com.z7design.fleet_manager.model.RouteExecution;
import com.z7design.fleet_manager.service.DriverReallocationService;
import com.z7design.fleet_manager.service.DriverShiftService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller para gestão de turnos de motoristas e realocação inteligente.
 */
@RestController
@RequestMapping("/api/driver-shifts")
public class DriverShiftController {

    @Autowired
    private DriverShiftService shiftService;

    @Autowired
    private DriverReallocationService reallocationService;

    // ========================
    // CRUD
    // ========================

    @GetMapping
    public List<DriverShift> getAllShifts() {
        return shiftService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<DriverShift> getShiftById(@PathVariable UUID id) {
        return ResponseEntity.ok(shiftService.findById(id));
    }

    @GetMapping("/date/{date}")
    public List<DriverShift> getShiftsByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return shiftService.findByDate(date);
    }

    @GetMapping("/driver/{driverId}")
    public List<DriverShift> getShiftsByDriver(
            @PathVariable UUID driverId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date != null) {
            return shiftService.findByDriverAndDate(driverId, date);
        }
        return shiftService.findByDriverAndDate(driverId, LocalDate.now());
    }

    @GetMapping("/driver/{driverId}/period")
    public List<DriverShift> getShiftsByDriverPeriod(
            @PathVariable UUID driverId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return shiftService.findByDriverAndPeriod(driverId, start, end);
    }

    @PostMapping
    public ResponseEntity<DriverShift> createShift(@RequestBody DriverShift shift) {
        return ResponseEntity.ok(shiftService.createShift(shift));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DriverShift> updateShift(@PathVariable UUID id, @RequestBody DriverShift shift) {
        return ResponseEntity.ok(shiftService.updateShift(id, shift));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShift(@PathVariable UUID id) {
        shiftService.deleteShift(id);
        return ResponseEntity.noContent().build();
    }

    // ========================
    // Controle de Turno
    // ========================

    /** Iniciar turno */
    @PostMapping("/{id}/start")
    public ResponseEntity<DriverShift> startShift(@PathVariable UUID id) {
        return ResponseEntity.ok(shiftService.startShift(id));
    }

    /** Finalizar turno */
    @PostMapping("/{id}/end")
    public ResponseEntity<DriverShift> endShift(@PathVariable UUID id) {
        return ResponseEntity.ok(shiftService.endShift(id));
    }

    /** Iniciar pausa */
    @PostMapping("/{id}/break/start")
    public ResponseEntity<DriverShift> startBreak(@PathVariable UUID id) {
        return ResponseEntity.ok(shiftService.startBreak(id));
    }

    /** Finalizar pausa */
    @PostMapping("/{id}/break/end")
    public ResponseEntity<DriverShift> endBreak(@PathVariable UUID id) {
        return ResponseEntity.ok(shiftService.endBreak(id));
    }

    // ========================
    // Localização
    // ========================

    /** Atualizar localização do motorista */
    @PutMapping("/{id}/location")
    public ResponseEntity<DriverShift> updateLocation(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> payload) {
        double lat = ((Number) payload.get("latitude")).doubleValue();
        double lon = ((Number) payload.get("longitude")).doubleValue();
        String name = (String) payload.getOrDefault("locationName", null);
        return ResponseEntity.ok(shiftService.updateLocation(id, lat, lon, name));
    }

    // ========================
    // Execuções de Rotas no Turno
    // ========================

    /** Atribuir rota ao turno */
    @PostMapping("/{shiftId}/routes/{routeId}")
    public ResponseEntity<RouteExecution> assignRoute(
            @PathVariable UUID shiftId,
            @PathVariable UUID routeId,
            @RequestBody(required = false) Map<String, String> payload) {
        LocalTime start = null;
        LocalTime end = null;
        boolean isReallocation = false;

        if (payload != null) {
            if (payload.containsKey("plannedStartTime")) {
                start = LocalTime.parse(payload.get("plannedStartTime"));
            }
            if (payload.containsKey("plannedEndTime")) {
                end = LocalTime.parse(payload.get("plannedEndTime"));
            }
            if (payload.containsKey("isReallocation")) {
                isReallocation = Boolean.parseBoolean(payload.get("isReallocation"));
            }
        }

        return ResponseEntity.ok(shiftService.assignRouteToShift(shiftId, routeId, start, end, isReallocation));
    }

    /** Iniciar execução de rota */
    @PostMapping("/executions/{executionId}/start")
    public ResponseEntity<RouteExecution> startExecution(
            @PathVariable UUID executionId,
            @RequestBody(required = false) Map<String, Object> payload) {
        Double lat = payload != null && payload.containsKey("latitude")
                ? ((Number) payload.get("latitude")).doubleValue() : null;
        Double lon = payload != null && payload.containsKey("longitude")
                ? ((Number) payload.get("longitude")).doubleValue() : null;
        return ResponseEntity.ok(shiftService.startRouteExecution(executionId, lat, lon));
    }

    /** Finalizar execução de rota */
    @PostMapping("/executions/{executionId}/complete")
    public ResponseEntity<RouteExecution> completeExecution(
            @PathVariable UUID executionId,
            @RequestBody(required = false) Map<String, Object> payload) {
        Double lat = null, lon = null, km = null;
        String obs = null;
        if (payload != null) {
            if (payload.containsKey("latitude")) lat = ((Number) payload.get("latitude")).doubleValue();
            if (payload.containsKey("longitude")) lon = ((Number) payload.get("longitude")).doubleValue();
            if (payload.containsKey("actualKm")) km = ((Number) payload.get("actualKm")).doubleValue();
            obs = (String) payload.getOrDefault("observations", null);
        }
        return ResponseEntity.ok(shiftService.completeRouteExecution(executionId, lat, lon, km, obs));
    }

    // ========================
    // Disponibilidade e Realocação
    // ========================

    /** Listar motoristas disponíveis para realocação */
    @GetMapping("/available")
    public List<DriverShift> getAvailableDrivers(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return shiftService.findAvailableDrivers(date != null ? date : LocalDate.now());
    }

    /** Motoristas disponíveis próximos a uma localização */
    @GetMapping("/available/nearby")
    public List<DriverShift> getAvailableNearby(
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam(defaultValue = "30") double radiusKm,
            @RequestParam(defaultValue = "0.25") double minHours) {
        return shiftService.findAvailableNearby(latitude, longitude, radiusKm, minHours);
    }

    /** Sugestões de realocação para todos os motoristas disponíveis */
    @GetMapping("/reallocation/suggestions")
    public List<DriverReallocationService.ReallocationSuggestion> getReallocationSuggestions(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return reallocationService.findReallocationSuggestions(date != null ? date : LocalDate.now());
    }

    /** Sugestões de realocação para um motorista específico */
    @GetMapping("/{shiftId}/reallocation/suggestions")
    public List<DriverReallocationService.ReallocationSuggestion> getSuggestionsForDriver(
            @PathVariable UUID shiftId) {
        return reallocationService.findSuggestionsForDriver(shiftId);
    }

    /** Executar realocação */
    @PostMapping("/{shiftId}/reallocate/{routeId}")
    public ResponseEntity<RouteExecution> executeReallocation(
            @PathVariable UUID shiftId,
            @PathVariable UUID routeId) {
        return ResponseEntity.ok(reallocationService.executeReallocation(shiftId, routeId));
    }
}
