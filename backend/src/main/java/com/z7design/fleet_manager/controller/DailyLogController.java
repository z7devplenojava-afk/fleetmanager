package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.DailyLog;
import com.z7design.fleet_manager.service.DailyLogService;
import com.z7design.fleet_manager.service.TelemetryReconciliationService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/daily-logs")
@RequiredArgsConstructor
public class DailyLogController {

    private final DailyLogService service;
    private final TelemetryReconciliationService telemetryReconciliationService;

    @GetMapping
    public List<DailyLog> getAll() {
        return service.findAll();
    }

    @GetMapping("/range")
    public List<DailyLog> getByRange(
            @RequestParam(value = "start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(value = "end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return service.findByDateRange(start, end);
    }

    @GetMapping("/{id}")
    public DailyLog getById(@PathVariable("id") UUID id) {
        return service.findById(id);
    }

    @PostMapping
    public DailyLog create(@RequestBody DailyLog dailyLog) {
        return service.save(dailyLog);
    }

    @PutMapping("/{id}")
    public DailyLog update(@PathVariable("id") UUID id, @RequestBody DailyLog dailyLog) {
        return service.update(id, dailyLog);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ===== PRD Módulo 5 (RF-05.1): assinatura do Fiscal da Contratante =====

    @PostMapping("/{id}/sign-inspector")
    public DailyLog signByInspector(@PathVariable("id") UUID id, @RequestBody Map<String, String> body) {
        return service.signByInspector(id, body.get("inspectorName"), body.get("signature"));
    }

    @GetMapping("/signed")
    public List<DailyLog> getSignedInPeriod(
            @RequestParam(value = "start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(value = "end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return service.findSignedInPeriod(start, end);
    }

    // ===== PRD Módulo 5 (RF-05.2): conciliação telemetria =====

    @PostMapping("/{id}/telemetry")
    public DailyLog importTelemetry(@PathVariable("id") UUID id, @RequestBody Map<String, Object> body) {
        Integer telemetryKm = body.get("telemetryKm") != null
                ? Integer.valueOf(body.get("telemetryKm").toString())
                : null;
        String source = body.get("source") != null ? body.get("source").toString() : null;
        return telemetryReconciliationService.importTelemetryKm(id, telemetryKm, source);
    }

    @PostMapping("/telemetry/batch")
    public Map<String, Integer> importTelemetryBatch(
            @RequestBody List<TelemetryReconciliationService.TelemetryReading> readings) {
        int processed = telemetryReconciliationService.importBatch(readings);
        return Map.of("processed", processed);
    }

    @GetMapping("/telemetry/divergent")
    public List<DailyLog> getDivergent() {
        return telemetryReconciliationService.findDivergent();
    }

    // ===== PRD Módulo 5 (RF-05.3): viagens extras classificadas =====

    @GetMapping("/extra-trips")
    public List<DailyLog> getExtraTrips(
            @RequestParam(value = "start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(value = "end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return service.findExtraTripsInPeriod(start, end);
    }
}
